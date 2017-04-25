'use strict';
import { patchOption } from './patch';
import { configManager } from './configManager';
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
         closeWatcher,
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
import { logManager } from './logger/logManager';
import { setQueueAsset } from './request/assetManager';
const EventEmitter = require('events').EventEmitter;

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
    this.eventEmitter = new EventEmitter();
    this.conf = new configManager(this);
    this.logManager = new logManager(this);

    this.paths = getPaths(this.options);

    this.assets = {};
    this.state = {};
    this.downloadList = [];
    this.queueList = [];
    this.queueInWork = [];
    this.inWork = false;
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

  stopStream () {
    return Promise.all([closeWatcher(this.conf, this.state)]);
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
