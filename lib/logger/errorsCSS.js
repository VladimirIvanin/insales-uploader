'use strict';
const notifier = require('node-notifier');
const _ = require('lodash');
var defaultNotifier = {
  sound: true,
  title: 'Insales Uploader',
  message: ''
}

export function errorsCSS(ownerOptions, eventEmitter, logger) {

  eventEmitter.on('css:error', function(data) {
    if (ownerOptions.consoleLogger) {
      defaultNotifier.message = 'Ошибка в файле стилей!';
      notifier.notify(defaultNotifier);
      console.log(data.message);
    }
  });

}
