'use strict';
import _ from 'lodash';

export function downloadEvents(ownerOptions, eventEmitter, logger) {
  /**
   * Начало скачивания
   */
  eventEmitter.on('theme:download:start', function(options) {
    if (ownerOptions.consoleLogger) {
      console.log(logger.notice('Start download:'));
      console.log(options.themeUrl);
    }
  });


  /**
   * Скачивание удачно закончилось
   */
  eventEmitter.on('theme:download:finish', function(options) {
    if (ownerOptions.consoleLogger) {
      console.log(logger.notice('Download 100%'));
    }
  });
}
