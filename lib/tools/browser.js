'use strict';
import _ from 'lodash';
import opn from 'opn';
var bs = require('browser-sync').create('insales_server');

export function startBrowser (url, options) {
  if (options && options.start || options.launch) {
    const _option = _.omit(options, ['start', 'launch']);
    opn(url, options)
  }
}

export function startBrowserSync (_url, options, paths) {
  const _options = _.omit(options.tools.browserSync, ['start', 'uploadRestart']);
  const url = _url.replace('https', 'http');
  const _optionDefault = {
    proxy: url,
    serveStatic: [options.theme.root],
    reloadDebounce: 5000,
    reloadDelay: 2000,
    https: false
  };
  const optionsInit = _.merge(_optionDefault, _options);
  bs.init(optionsInit);
}
