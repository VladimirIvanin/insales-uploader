'use strict';
const notifier = require('node-notifier');
const _ = require('lodash');
var defaultNotifier = {
  sound: true,
  title: 'Insales Uploader',
  message: ''
}

export function errorsFile(ownerOptions, eventEmitter, logger) {

  eventEmitter.on('file:error', function(data) {
    if (ownerOptions.consoleLogger) {
      defaultNotifier.message = data.message;
      notifier.notify(defaultNotifier);
      console.error(data.message);
    }
  });

}
