'use strict';

export function streamEvents(ownerOptions, eventEmitter, logger) {

  eventEmitter.on('theme:stream:start', function(options) {
    if (ownerOptions.consoleLogger) {
      if (options.themeTitle) {
        console.log(logger.label('Тема: ') + logger.text(options.themeTitle));
      }
      console.log(logger.label('Статус темы: ') + logger.text(options.themeStatus));
      console.info(logger.start('Start watch'));
    }
  });

  eventEmitter.on('theme:stream:stop', function(options) {
    if (ownerOptions.consoleLogger) {
      console.info(logger.start(options.message));
    }
  });

}
