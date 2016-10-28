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

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);
var bs = require('browser-sync').get('insales server');

export function getAsset (_owner, _asset, action) {
  let startBackup = _owner.options.theme.startBackup;
  let isUpdateFile = _owner.options.theme.update;

  return new Promise(function (resolve, reject) {
    _owner.insales.getAsset({
      token: _owner.options.account.token,
      url: _owner.options.account.url,
      theme: _owner.options.theme.id,
      assetId: _asset.id
    }).then(response => {
      let dataReponse = response.data.asset;
      let _uri = 'http://' + _owner.options.account.url + dataReponse.asset_url;
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

export function getAssets (_owner, action) {
  return new Promise(function (resolve, reject){
    var _size = _.size(_owner.downloadList);
    var _count = 0;
    recursionDownload(_owner, _count, _size, action).then(function () {
      setTimeout(function () {
        resolve();
      }, 200);
    })
  });
}

function recursionDownload(_owner, count, size, action) {
  return new Promise(function (resolve, reject){
    console.log();
    const statusBar = new ProgressBar('Downloading: :file [:bar] :percent', {
      complete: '█',
      incomplete: '.',
      width: 20,
      clear: true,
      total: size
    });
    let assetName = _owner.downloadList[count].name;
    statusBar.tick({
      'file': assetName
    });
  _recursion(_owner, count, size, action);
  function _recursion(_owner, count, size, action) {
    let assetName = _owner.downloadList[count].name;
    statusBar.tick({
      'file': assetName
    });
    getAsset(_owner, _owner.downloadList[count], action).then(function (_asset) {
      ++count
      if (count === size) {
        console.log(log_notice('Download 100%'));
        resolve()
      }else{
        return _recursion(_owner, count, size, action)
      }
    }, function (_asset) {
      ++count
      if (count === size) {
        console.log(log_error('Download error'));
        resolve()
      }else{
        return _recursion(_owner, count, size, action)
      }
    })
    }
  });
}

export function updateteAssets(_owner) {
  return new Promise(function (resolve, reject) {
    if (_owner.state.uploaded) {
      _owner.state.inProcess = false;
      resolve()
    }else{
      _owner.state.inProcess = true;
      _owner.insales.listAsset({
        token: _owner.options.account.token,
        url: _owner.options.account.url,
        theme: _owner.options.theme.id
      }).then(response => {
        var _assets = response.data.assets.asset;
        patchAsset(_owner, _owner.paths, _owner.options, _assets).then(function () {
          _owner.state.inProcess = false;
          resolve()
          return _owner;
        })
      }).catch(err => {
        if (err.msg) {
          console.info(err.msg);
        }else{
          console.log(err);
        }
        _owner.state.inProcess = false;
        resolve();
      });
    }
  });
}

export function updateListThemes(_owner) {
  return new Promise(function (resolve, reject) {
    _owner.insales.listThemes({
      token: _owner.options.account.token,
      url: _owner.options.account.url
    }).then(response => {
      var responseTheme = response.data.themes.theme;
      var _themes = [];
      if (_.isArray(responseTheme)) {
        _themes = responseTheme;
      }else{
        _themes.push(responseTheme)
      }
      patchThemes(_owner, _themes).then(function () {
        resolve();
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

export function uploadAsset (_owner, asset, _path, task) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function () {
      uploadAsset (_owner, asset, _path, task);
    }, 300)
  }else{
      _owner.state.inProcess = true;
      _owner.insales.uploadAsset({
        token: _owner.options.account.token,
        url: _owner.options.account.url,
        theme: _owner.options.theme.id,
        asset
      }).then(output => {
        if (!(task && task.action == 'push')) {
          console.log(log_notice('Upload ' + asset.type + ': '+ asset.name + ' from ' + _path));
          if (_owner.options.tools.browserSync && _owner.options.tools.browserSync.uploadRestart) {
            bs.reload();
          }
        }
        _owner.state.inProcess = false;
        resolve()
      }).catch(err => {
        _owner.state.inProcess = false;
        console.error('error upload:' + asset.name, err.msg);
        reject()
      });
    }
  });
}

export function removeAsset (_owner, assetId, path, name, task) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function () {
      return removeAsset (_owner, assetId, path, name, task);
    }, 300)
  }else{
    _owner.state.inProcess = true;
    _owner.insales.removeAsset({
      token: _owner.options.account.token,
      url: _owner.options.account.url,
      theme: _owner.options.theme.id,
      assetId: assetId,
    }).then(output => {
      delete _owner.assets[path];
      if (!(task && task.action == 'push')) {
        if (path) {
          console.log(log_remove('Remove: ' + path));
        }
        if (_owner.options.tools.browserSync.start) {
          bs.reload();
        }
      }
      _owner.state.inProcess = false;
      resolve();
    }).catch(err => {
      delete _owner.assets[path];
      console.error('Remove error: ' + name, assetId, err.msg);
      _owner.state.inProcess = false;
      reject()
    });
   }
  });
}

export function editAsset (_owner, _asset, assetId, path, task) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function () {
      editAsset (_owner, _asset, assetId, path, task);
    }, 300)
  }else{
    _owner.state.inProcess = true;
    _owner.insales.editAsset({
      token: _owner.options.account.token,
      url: _owner.options.account.url,
      theme: _owner.options.theme.id,
      assetId: assetId,
      asset: _asset
    }).then(output => {
      if (!(task && task.action == 'push')) {
        console.log(log_edit('edit: ' + path));
        if (_owner.options.tools.browserSync.start) {
          bs.reload();
        }
      }
      _owner.state.inProcess = false;
      resolve();
    }).catch(err => {
        if (err.msg) {
          console.error(err.msg);
        }else{
          console.error(err);
        }
      _owner.state.inProcess = false;
      reject();
    });
  }
  });
}
