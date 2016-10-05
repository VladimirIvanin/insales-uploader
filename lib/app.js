'use strict';
import InsalesApi from 'insales';
import { createDir,
         reloadDir,
         zippedDir } from './file-system/dir';
import { _watch,
         watcher } from './file-system/watch';
import { initAssets,
         diffLocalAssets } from './file-system/assets';
import { getAsset,
         getAssets,
         updateListThemes,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from './request/asset';
import { getPaths } from './paths';
import { setQueueAsset } from './request/assetManager';
import { patchOption } from './patch';
import { startBrowser } from './tools/open-browser';

class InSalesUploader {
  constructor(options){
    this.options = patchOption(options);
    this.paths = getPaths(this.options);

    this.assets = {};
    this.state = {};
    this.themes = {};
    this.downloadList = [];
    this.queueList = [];
    this.queueInWork = [];
    this.inWork = false;

    this.insales = InsalesApi({
      id: this.options.account.id,
      secret: this.options.account.token,
      http: this.options.account.http
    });
  }

  startBrowser(url, options) {
    return startBrowser(url, options);
  }

  openBrowser() {
    const _options = Object.assign({}, this.options.tools.openBrowser);
    _options.launch = true;
    return startBrowser(this.options.themeUrl, _options);
  }

  createDir(paths, options, action) {
    return Promise.all([createDir(this.paths, this.options, action)]);
  }

  reloadDir(paths, action) {
    return Promise.all([reloadDir(this.paths, action)]);
  }

  zippedDir(paths, _path, _save_to, _filter) {
    return Promise.all([reloadDir(this.paths, _path, _save_to, _filter)]);
  }

  setQueueAsset(owner, _task, _path) {
    return setQueueAsset(this, _task, _path);
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

  updateListThemes(owner) {
    return updateListThemes(this);
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

  initAssets() {
    return initAssets(this.paths);
  }

  diffLocalAssets() {
    return diffLocalAssets(this.paths, this.assets, this);
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
      self.createDir(self.paths, self.options, action).then(function() {
        self.updateteAssets(self).then(function() {
          self.getAssets(self, action).then(function() {
            if (self.options.theme.startBackup && self.options.theme.backup === 'zip') {
              zippedDir(self, self.options.pathBackup, `${self.options.handle}-backup`, 'backup').then(function() {
                console.info(self.options.themeUrl);
                diffLocalAssets(self.paths, self.assets, self.owner).then(function() {
                  resolve();
                })
              });
            }else{
              console.info(self.options.themeUrl);
              diffLocalAssets(self.paths, self.assets, self.owner).then(function() {
                resolve();
              })
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
            if ( _settings && _settings.zip || self.options.theme.backup === 'zip') {
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
      diffLocalAssets(self.paths, self.assets, self.owner).then(function() {
            resolve();
            return watcher(self)
        })
      })
    });
  }
  stream () {
    var self = this;
    return Promise.all([
      this._stream()
    ]).then(function() {
      updateListThemes(self).then(function() {
        if (self.themes.current.title) {
          console.log('Тема: ' + self.themes.current.title);
        }
        console.log('Статус темы: ' + self.themes.current.type);
        startBrowser(self.options.themeUrl, self.options.tools.openBrowser)
        console.info('Start watch')
      });
    })
  }
}

export default options => new InSalesUploader(options);
