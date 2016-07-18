import { fileMissing,
         writeFile,
         writeManager,
         writeFileWithDownload   } from '../file-system/file';
import { patchAsset } from '../patch';
import _ from 'lodash';
import Promise from 'promise';

export function getAsset (_owner, _asset, action) {
  return new Promise(function (resolve, reject) {
    _owner.insales.getAsset({
      token: _owner.options.token,
      url: _owner.options.url,
      theme: _owner.options.theme,
      assetId: _asset.id
    }).then(response => {
      var dataReponse = response.data.asset;
      var _contents = dataReponse.content
      var _uri = 'http://' + _owner.options.url + dataReponse.asset_url;
      const _status = fileMissing(_asset.path)

      _status.then(function () {
        action.rewrite = true;
        writeManager(_asset, _uri, dataReponse, action, _owner, resolve(response.data.asset));
      }, function () {
        if (_owner.options.update) {
          action.rewrite = true;
          writeManager(_asset, _uri, dataReponse, action, _owner, resolve(response.data.asset));
        }else{
          if (action.method == 'backup' || _owner.options.startBackup) {
            action.rewrite = false;
            writeManager(_asset, _uri, dataReponse, action, _owner, resolve(response.data.asset));
          }else{
            reject(response.data.asset)
          }
        }
      })
    }).catch(err => {
      console.error('error: ' + _asset.name, err.url);
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
      }, 400);
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
    }, 300)
  }
  });
}
export function upadeteAssets(_owner) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner) {
      upadeteAssets (_owner);
    }, 300)
  }else{
    _owner.state.inProcess = true;
    _owner.insales.listAsset({
      token: _owner.options.token,
      url: _owner.options.url,
      theme: _owner.options.theme
    }).then(response => {
      var _assets = response.data.assets.asset;
      patchAsset(_owner, _assets).then(function () {
        _owner.state.inProcess = false;
        resolve()
        return _owner;
      })
    }).catch(err => {
      console.info(err.msg);
      _owner.state.inProcess = false;
      reject(err.msg);
    });
  }
  });
}

export function uploadAsset (_owner, asset, _path) {

  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner, asset, _path) {
      uploadAsset (_owner, asset, _path);
    }, 300)
  }else{
      _owner.uploading = true;
      _owner.insales.uploadAsset({
        token: _owner.options.token,
        url: _owner.options.url,
        theme: _owner.options.theme,
        asset
      }).then(output => {
        console.info('Upload ' + asset.type + ': '+ asset.name + ' from ' + _path);
        upadeteAssets(_owner).then(function () {
          _owner.state.inProcess = false;
          resolve()
        })
      }).catch(err => {
        console.error(asset.name, err.msg);
        upadeteAssets(_owner).then(function () {
          _owner.state.inProcess = false;
          reject()
        })
      });
    }
  });
}

export function removeAsset (_owner, assetId, path, name) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner, assetId, path, name) {
      removeAsset (_owner, assetId, path, name);
    }, 300)
  }else{
    _owner.insales.removeAsset({
      token: _owner.options.token,
      url: _owner.options.url,
      theme: _owner.options.theme,
      assetId: assetId,
    }).then(output => {
      delete _owner.assets[name];
      console.info('Remove: ' + path);
      upadeteAssets(_owner).then(function () {
        _owner.state.inProcess = false;
        resolve()
      })
    }).catch(err => {
      console.error(name, assetId, err.msg);
      upadeteAssets(_owner).then(function () {
        _owner.state.inProcess = false;
        reject()
      })
    });
   }
  });
}

export function editAsset (_owner, _asset, assetId, path) {
  return new Promise(function (resolve, reject) {
  if (_owner.state.inProcess) {
    setTimeout(function (_owner, _asset, assetId, path) {
      editAsset (_owner, _asset, assetId, path);
    }, 300)
  }else{
    _owner.insales.editAsset({
      token: _owner.options.token,
      url: _owner.options.url,
      theme: _owner.options.theme,
      assetId: assetId,
      asset: _asset
    }).then(output => {
      console.info('edit: ' + path);
      resolve();
    }).catch(err => {
      console.error(err.msg);
      reject();
    });
  }
  });
}
