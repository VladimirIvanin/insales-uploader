import { fileMissing,
         writeFile,
         writeManager,
         writeFileWithDownload   } from '../file-system/file';
import { patchAsset,
         patchThemes } from '../patch';
import _ from 'lodash';
import Promise from 'promise';
import clc from 'cli-color';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

var bs = require('browser-sync').get('insales server');

export function getAsset (_owner, _asset, action) {
  return new Promise(function (resolve, reject) {
    _owner.insales.getAsset({
      token: _owner.options.account.token,
      url: _owner.options.account.url,
      theme: _owner.options.theme.id,
      assetId: _asset.id
    }).then(response => {
      var dataReponse = response.data.asset;
      var _contents = dataReponse.content
      var _uri = 'http://' + _owner.options.account.url + dataReponse.asset_url;
      const _status = fileMissing(_asset.path)

      _status.then(function () {
        action.rewrite = true;
        writeManager(_asset, _uri, dataReponse, action, _owner, resolve(response.data.asset));
      }, function () {
        if (_owner.options.theme.update) {
          action.rewrite = true;
          writeManager(_asset, _uri, dataReponse, action, _owner, resolve(response.data.asset));
        }else{
          if (action.method == 'backup' || _owner.options.theme.startBackup) {
            action.rewrite = false;
            writeManager(_asset, _uri, dataReponse, action, _owner, resolve(response.data.asset));
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
  _recursion(_owner, count, size, action);
  function _recursion(_owner, count, size, action) {
    setTimeout(function () {
      getAsset(_owner, _owner.downloadList[count], action).then(function (_asset) {
        ++count
        if (count === size) {
          resolve()
        }else{
          return _recursion(_owner, count, size, action)
        }
      }, function (_asset) {
        ++count
        if (count === size) {
          resolve()
        }else{
          return _recursion(_owner, count, size, action)
        }
      })
    }, 100)
  }
  });
}

export function updateteAssets(_owner) {
  return new Promise(function (resolve, reject) {
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

export function uploadAsset (_owner, asset, _path) {

  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner, asset, _path) {
      uploadAsset (_owner, asset, _path);
    }, 100)
  }else{
      _owner.inProcess = true;
      _owner.insales.uploadAsset({
        token: _owner.options.account.token,
        url: _owner.options.account.url,
        theme: _owner.options.theme.id,
        asset
      }).then(output => {
        console.log(log_notice('Upload ' + asset.type + ': '+ asset.name + ' from ' + _path));
        if (_owner.options.tools.browserSync && _owner.options.tools.browserSync.uploadRestart) {
          bs.reload();
        }
        _owner.state.inProcess = false;
        resolve()
      }).catch(err => {
        console.error(asset.name, err.msg);
        _owner.state.inProcess = false;
        reject()
      });
    }
  });
}

export function removeAsset (_owner, assetId, path, name) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner, assetId, path, name) {
      removeAsset (_owner, assetId, path, name);
    }, 100)
  }else{
    _owner.inProcess = true;
    _owner.insales.removeAsset({
      token: _owner.options.account.token,
      url: _owner.options.account.url,
      theme: _owner.options.theme.id,
      assetId: assetId,
    }).then(output => {
      delete _owner.assets[path];
      console.log(log_remove('Remove: ' + path));
      if (_owner.options.tools.browserSync.start) {
        bs.reload();
      }
      _owner.state.inProcess = false;
      resolve()
    }).catch(err => {
      delete _owner.assets[path];
      console.error(name, assetId, err.msg);
      _owner.state.inProcess = false;
      reject()
    });
   }
  });
}

export function editAsset (_owner, _asset, assetId, path) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner, _asset, assetId, path) {
      editAsset (_owner, _asset, assetId, path);
    }, 100)
  }else{
    _owner.inProcess = true;
    _owner.insales.editAsset({
      token: _owner.options.account.token,
      url: _owner.options.account.url,
      theme: _owner.options.theme.id,
      assetId: assetId,
      asset: _asset
    }).then(output => {
      console.log(log_edit('edit: ' + path));
      if (_owner.options.tools.browserSync.start) {
        bs.reload();
      }
      _owner.inProcess = false;
      resolve();
    }).catch(err => {
        if (err.msg) {
          console.error(err.msg);
        }else{
          console.error(err);
        }
      _owner.inProcess = false;
      reject();
    });
  }
  });
}
