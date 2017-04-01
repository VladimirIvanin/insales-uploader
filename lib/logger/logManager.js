'use strict';
import _ from 'lodash';
import { getColor } from './colors'
import { downloadEvents } from './themeDownload'
import { zipEvents } from './themeZip'
import { streamEvents } from './themeStream'

export class logManager {
  constructor(owner) {
    this.owner = owner;
    this.eventEmitter = owner.conf.get('eventEmitter');
    this.options = owner.conf.get('options');
    this.logger = getColor();

    this.downloadEvents();
    this.zipEvents();
    this.streamEvents();
  }

  downloadEvents(){
    return downloadEvents(this.options, this.eventEmitter, this.logger)
  }

  zipEvents(){
    return zipEvents(this.options, this.eventEmitter, this.logger)
  }

  streamEvents(){
    return streamEvents(this.options, this.eventEmitter, this.logger)
  }


}
