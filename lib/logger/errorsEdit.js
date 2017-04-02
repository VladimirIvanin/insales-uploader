'use strict';
const notifier = require('node-notifier');
const _ = require('lodash');
var defaultNotifier = {
  sound: true,
  title: 'Insales Uploader',
  message: ''
}

export function errorsEdit(ownerOptions, eventEmitter, logger) {

  eventEmitter.on('error:edit', function(data) {
    if (ownerOptions.consoleLogger) {

      if (data.err.msg) {
        if (_.isObject(data.err.msg)) {
          if (data.err.msg.errors && data.err.msg.errors['error']) {
            defaultNotifier.message = data.err.msg.errors['error'];
          }else{
            defaultNotifier.message = `Ошибка при редактировании файла ${data.path}`;
          }
        }
        notifier.notify(defaultNotifier);
        console.error(data.err.msg);
      }else{
        defaultNotifier.message = `Ошибка при редактировании файла ${data.path}`;
        notifier.notify(defaultNotifier);
        console.error(data.err);
      }
    }
  });

}
