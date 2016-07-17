'use strict';
import InsalesApi from 'insales';
import { createDir } from './file-system/dir';
import { _watch,
         watcher } from './file-system/watch';
import { getAsset,
         getAssets,
         upadeteAssets,
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
    self.downloadList = [];

    self.insales = InsalesApi({
      id: this.options.id,
      secret: this.options.token,
      http: this.options.http
    });
  }


  createDir() {
    return createDir(this);
  }

  getAsset(_asset) {
    return getAsset(this, _asset);
  }

  getAssets(action) {
    return getAssets(this, action);
  }

  upadeteAssets() {
    return upadeteAssets(this);
  }

  uploadAsset(_asset, _path) {
    return uploadAsset(this, _asset, _path);
  }

  removeAsset(_assetId, _path, _name) {
    return removeAsset(this, _assetId, _path, _name);
  }

  editAsset(_asset, assetId, path) {
    return editAsset(this, _asset, assetId, path);
  }

  watcher() {
    return watcher(this);
  }

  _watch(event, path) {
    return _watch(this, event, path);
  }

  download () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var action = {
        method: 'download'
      }
      self.createDir(self);
      self.upadeteAssets(self).then(function() {
        getAssets(self, action).then(function() {
          resolve()
        });
      });
    });
  }

  backup () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var action = {
        method: 'backup'
      }
      self.createDir();
      self.upadeteAssets(self).then(function() {
        getAssets(self, action)
      });
    });
  }
  stream () {
    var self = this;
    this.upadeteAssets(self).then(function () {
      watcher(self)
    })
  }
}

export default options => new InSalesUploader(options);
