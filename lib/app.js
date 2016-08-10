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

class InSalesUploader {
  constructor(options){
    const self = this;
    self.options = options || {};
    if (!self.options.id) throw new Error('Missing app id');
    if (!self.options.token) throw new Error('Missing app token');
    if (!self.options.url) throw new Error('Missing app url');
    self.options.protocol = (self.options.http) ? 'http://' : 'https://';

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
            resolve()
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

  _release () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var action = {
        method: 'release'
      }
      var _path = self.options.root + '/release';

      self.reloadDir(self, action).then(function() {
        self.updateteAssets(self).then(function() {
          getAssets(self, action).then(function() {
            zippedDir(self, _path, 'release', 'release').then(function() {
              resolve();
            });
          });
        });
      });
    });
  }

  release () {
    return Promise.all([
      this._release()
    ])
  }

  _backup () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var action = {
        method: 'backup'
      }
      self.createDir(self, action).then(function() {
        self.updateteAssets(self).then(function() {
          getAssets(self, action).then(function() {
            resolve()
            return;
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
