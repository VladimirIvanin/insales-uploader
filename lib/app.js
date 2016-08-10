'use strict';
import InsalesApi from 'insales';
import { createDir,
         reloadDir,
         zippedDir } from './file-system/dir';
import { _watch,
         watcher } from './file-system/watch';
import { getAsset,
         getAssets,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from './request/asset';
import { instance } from './instance';
import { patchOption } from './patch';

class InSalesUploader {
  constructor(options){
    const self = this;
    self.options = {};
    patchOption(self, options);

    self.instance = instance(self)

    self.assets = {};
    self.state = {};
    self.downloadList = [];
    self.releaseList = [];

    self.insales = InsalesApi({
      id: this.options.id,
      secret: this.options.token,
      http: this.options.http
    });
  }


  createDir(owner, action) {
    return Promise.all([createDir(this, action)]);
  }

  reloadDir(owner, action) {
    return Promise.all([reloadDir(this, action)]);
  }

  zippedDir(owner, _path, _save_to, _filter) {
    return Promise.all([reloadDir(this, _path, _save_to, _filter)]);
  }

  getAsset(owner, _asset) {
    return getAsset(this, _asset);
  }

  getAssets(owner, action) {
    return getAssets(this, action);
  }

  updateteAssets(owner) {
    return updateteAssets(this);
  }

  uploadAsset(owner, _asset, _path) {
    return uploadAsset(this, _asset, _path);
  }

  removeAsset(owner, _assetId, _path, _name) {
    return removeAsset(this, _assetId, _path, _name);
  }

  editAsset(owner, _asset, assetId, path) {
    return editAsset(this, _asset, assetId, path);
  }

  watcher(owner) {
    return watcher(this);
  }

  _watch(owner, event, path) {
    return _watch(this, event, path);
  }

  _download () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var action = {
        method: 'download'
      }
      self.createDir(self, action).then(function() {
        self.updateteAssets(self).then(function() {
          getAssets(self, action).then(function() {
            if (self.options.theme.startBackup && self.options.theme.backup === 'zip') {
              zippedDir(self, self.options.pathBackup, `${self.options.handle}-backup`, 'backup').then(function() {
                resolve();
              });
            }else{
              resolve()
            }
          });
        });
      });
    });
  }

  download () {
    return Promise.all([
      this._download()
    ])
  }

  _backup (_settings) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var action = {
        method: 'backup'
      }
      self.reloadDir(self, action).then(function() {
        self.updateteAssets(self).then(function() {
          getAssets(self, action).then(function() {
            if ( self.options.theme.backup === 'zip' || _settings && _settings.zip) {
              zippedDir(self, self.options.pathBackup, `${self.options.handle}-backup`, 'backup').then(function() {
                resolve();
              });
            }else{
              resolve();
            }
          });
        });
      });
    });
  }

  backup () {
    return Promise.all([
      this._backup()
    ])
  }

  backupToZip () {
    return Promise.all([
      this._backup({zip: true})
    ])
  }

  _stream () {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.updateteAssets(self).then(function () {
        resolve()
        return watcher(self)
      })
    });
  }
  stream () {
    return Promise.all([
      this._stream()
    ]).then(function() {
      setTimeout(function () {
        console.info('Start watch')
      }, 500);
    })
  }
}

export default options => new InSalesUploader(options);
