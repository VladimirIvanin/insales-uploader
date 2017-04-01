'use strict';

export function zipEvents(ownerOptions, eventEmitter, logger) {

  eventEmitter.on('theme:zip:start', function(options) {
    if (ownerOptions.consoleLogger) {
      console.log(logger.start(options.message));
    }
  });

  eventEmitter.on('theme:zip:finish', function(options) {
    if (ownerOptions.consoleLogger) {
      console.log(logger.notice(options.message));
    }
  });

}
