'use strict';
const notifier = require('node-notifier');
const _ = require('lodash');
var defaultNotifier = {
  sound: true,
  title: 'Insales Uploader',
  message: ''
}

export function errorsJs(ownerOptions, eventEmitter, logger) {

  eventEmitter.on('js:error', function(data) {
    if (ownerOptions.consoleLogger) {
      defaultNotifier.message = 'Ошибка в javascript!';
      notifier.notify(defaultNotifier);
      console.log(logger.warn(data.warn));
      console.log(data.message);
    }
  });

}
