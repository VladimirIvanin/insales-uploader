'use strict';
import { patchOption } from './patch';
import { downloadTheme,
         streamTheme,
         backupTheme } from './interface';
import { checkPackageVersion } from './cli/packageVersion';
import { startBrowser,
         startBrowserSync } from './tools/browser';
import InsalesApi from 'insales';
import { createDir,
         reloadDir,
         zippedDir } from './file-system/dir';
import { _watch,
         watcher,
         triggerFile,
         uploadAssets } from './file-system/watch';
import { initAssets,
         pushTheme,
         pullTheme,
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
import Configstore from 'configstore';

import clc from 'cli-color';
const log_edit = clc.xterm(40);
const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_white = clc.xterm(254);
const log_label = clc.xterm(81);
const log_text = clc.xterm(254);
const log_start = clc.xterm(129);

class InSalesUploader {
  constructor(options){
    this.options = patchOption(options);
    this.paths = getPaths(this.options);

    this.assets = {};
    this.state = {};
    this.downloadList = [];
    this.queueList = [];
    this.queueInWork = [];
    this.inWork = false;

    this.conf = new Configstore(this.options.handle);
    this.conf.set('options', this.options);
    this.conf.set('assets', this.assets);
    this.conf.set('paths', this.paths);
    this.conf.set('downloadList', this.downloadList);
  }

  startBrowser(url, options) {
    return startBrowser(url, options);
  }

  openBrowser() {
    const _options = Object.assign({}, this.options.tools.openBrowser);
    _options.launch = true;
    return startBrowser(this.options.themeUrl, _options);
  }

  startBrowserSync() {
    return startBrowserSync(this.options.themeUrl, this.options, this.paths);
  }

  upload(param) {
    return uploadAssets(this.conf, this.state, param);
  }

  initAssets() {
    return initAssets(this.paths);
  }

  diffLocalAssets() {
    return diffLocalAssets(this.conf, this.state);
  }

  pushTheme() {
    return pushTheme(this.conf, this.state);
  }

  pullTheme() {
    return Promise.all([pullTheme(this.conf, this.state)]);
  }

  download () {
    return Promise.all([downloadTheme(this.conf, this.state)]);
  }

  stream () {
    return Promise.all([streamTheme(this.conf, this.state)]);
  }

  triggerFile(event, _path) {
    return Promise.all([triggerFile(this.conf, this.state, event, _path)]);
  }

  _backup (_settings) {
    return backupTheme(this.conf, this.state, _settings)
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
}

export default options => new InSalesUploader(options);
