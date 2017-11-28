'use strict';
import InsalesApi from 'insales';
import { fileMissing,
         writeFile,
         writeManager,
         writeFileWithDownload   } from '../file-system/file';
import { patchAsset,
         patchThemes } from '../patch';
import _ from 'lodash';
import Promise from 'promise';
import clc from 'cli-color';
import ProgressBar from 'progress';
import delay from 'delay';
import moment from 'moment';
import TaskManager from '../taskManager';


const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);
var bsync = require('browser-sync');

export function getAsset (conf, _asset, action) {
  const options = conf.get('options');
  const InSales = InsalesApi(options.insalesApi);
  let startBackup = options.theme.startBackup;
  let isUpdateFile = options.theme.update;

  return new Promise((resolve, reject) => {
    InSales.getAsset({
      token: options.account.token,
      url: options.account.url,
      theme: options.theme.id,
      assetId: _asset.id
    }).then(response => {
      let dataReponse = response.data.asset;
      let _uri = 'https://assets.insales.ru' + dataReponse.asset_url;
      let _status = fileMissing(_asset.path)

      _status.then(function () {
        action.rewrite = true;
        writeManager(_asset, _uri, dataReponse, action, startBackup).then(function () {
          resolve(response.data.asset)
        });
      }, function () {
        if (isUpdateFile) {
          action.rewrite = true;
          writeManager(_asset, _uri, dataReponse, action, startBackup).then(function () {
            resolve(response.data.asset)
          });
        }else{
          if (action.method == 'backup' || startBackup) {
            action.rewrite = false;
            writeManager(_asset, _uri, dataReponse, action, startBackup).then(function () {
              resolve(response.data.asset)
            });
          }else{
            reject(response.data.asset)
          }
        }
      })
    }).catch(err => {
      throw new Error(`Ошибка при скачивании файла "${_asset.name}", попробуйте запустить скачивание повторно.`);
      reject(err.msg)
    });

  });
}

const downloadManager = new TaskManager({
  delay: 50,
  statusBar: {
    template: 'Downloading: :name [:bar] :percent'
  }
});

export function getAssets (conf, action) {
  const downloadList = conf.get('downloadList');
  const eventEmitter = conf.get('eventEmitter');

  return new Promise(function (resolve, reject){

    downloadManager.createTask('download', function (asset) {
      return new Promise(function(resolve, reject) {
        getAsset(conf, asset, action).then(() => {
          resolve(asset)
        }, function () {
          console.log(log_error('Download error'));
          resolve(asset);
        })
      });
    })

    downloadList.sort(function (a, b) {
      if (a.queue > b.queue) {
        return 1;
      }
      if (a.queue < b.queue) {
        return -1;
      }
      return 0;
    });

    let listTask = _.reduce(downloadList, function(result, value, key) {
      let _result = {
        task: 'download',
        param: value
      }
      result.push(_result)
      return result;
    }, []);

    downloadManager.addTaskList(listTask).then(() => {
      delay(300)
      .then(() => {
        eventEmitter.emit('theme:download:finish');
        resolve();
      });
    })
  });
}

export function updateteAssets(conf, state) {
  const options = conf.get('options');
  const paths = conf.get('paths');
  const assets = conf.get('assets');
  const downloadList = conf.get('downloadList');
  const InSales = InsalesApi(options.insalesApi);

  return new Promise(function (resolve, reject) {
    InSales.listAsset({
      token: options.account.token,
      url: options.account.url,
      theme: options.theme.id
    }).then(response => {
      let _assets = response.data.assets.asset;
      patchAsset(conf, assets, _assets).then(function () {
        resolve();
      })
    }).catch(err => {
      console.log('er');
      if (err.msg) {
        console.info(err.msg);
      }else{
        console.log(err);
      }
      resolve();
    });
  });
}

export function updateListThemes(conf, state) {
  const options = conf.get('options');
  const paths = conf.get('paths');
  const assets = conf.get('assets');
  const InSales = InsalesApi(options.insalesApi);

  return new Promise(function (resolve, reject) {
    InSales.listThemes({
      token: options.account.token,
      url: options.account.url
    }).then(response => {
      var responseTheme = response.data.themes.theme;
      var _themes = [];
      if (_.isArray(responseTheme)) {
        _themes = responseTheme;
      }else{
        _themes.push(responseTheme)
      }
      patchThemes(conf, _themes).then(theme => {
        resolve(theme);
      })
    }).catch(err => {
      if (err.msg) {
        console.info(err.msg);
      }else{
        console.log(err);
      }
      resolve();
    });
  });
}

export function uploadAsset (conf, state, asset, _path, task) {
  const options = conf.get('options');
  const paths = conf.get('paths');
  const InSales = InsalesApi(options.insalesApi);

  return new Promise(function (resolve, reject) {
    InSales.uploadAsset({
      token: options.account.token,
      url: options.account.url,
      theme: options.theme.id,
      asset
    }).then(output => {
      if (!(task && task.action == 'push')) {
        var _now = moment();
        var _log = `[${_now.format('HH:mm:ss')}] Upload: ${asset.type}: ${asset.name} from ${_path}`;
        console.log(log_notice(_log));
        if (options.tools.browserSync && options.tools.browserSync.uploadRestart) {
          const bs = bsync.get('insales_server');
          bs.reload();
        }
      }

      resolve()
    }).catch(err => {

      console.error('error upload:' + asset.name, err.msg);
      reject()
    });
  });
}

export function removeAsset (conf, state, assetId, path, name, task) {
  const options = conf.get('options');
  const paths = conf.get('paths');
  const assets = conf.get('assets');
  const InSales = InsalesApi(options.insalesApi);

  return new Promise(function (resolve, reject) {
    InSales.removeAsset({
      token: options.account.token,
      url: options.account.url,
      theme: options.theme.id,
      assetId: assetId,
    }).then(output => {
      delete assets[path];
      conf.set('assets', assets);
      if (!(task && task.action == 'push')) {
        if (path) {
          var _now = moment();
          var _log = `[${_now.format('HH:mm:ss')}] Remove: ${path}`;
          console.log(log_remove(_log));
        }
        if (options.tools.browserSync.start) {
          const bs = bsync.get('insales_server');
          bs.reload();
        }
      }
      resolve();
    }).catch(err => {
      delete assets[path];
      conf.set('assets', assets);

      console.error('Remove error: ' + name, assetId, err.msg);
      reject()
    });

  });
}

export function editAsset (conf, state, _asset, assetId, path, task) {
  const options = conf.get('options');
  const eventEmitter = conf.get('eventEmitter');
  const InSales = InsalesApi(options.insalesApi);

  return new Promise(function (resolve, reject) {
    InSales.editAsset({
      token: options.account.token,
      url: options.account.url,
      theme: options.theme.id,
      assetId: assetId,
      asset: _asset
    }).then(output => {
      if (!(task && task.action == 'push')) {
        var _now = moment();
        var _log = `[${_now.format('HH:mm:ss')}] Edit: ${path}`;
        console.log(log_edit(_log));
        if (options.tools.browserSync.start) {
          const bs = bsync.get('insales_server');
          bs.reload();
        }
      }
      resolve();
    }).catch(err => {
      eventEmitter.emit('error:edit', {err, path});
      reject();
    });
  });
}
