'use strict';
import _ from 'lodash';
import { getColor } from './colors'
import { downloadEvents } from './themeDownload'
import { zipEvents } from './themeZip'
import { streamEvents } from './themeStream'
import { errorsEdit } from './errorsEdit'
import { errorsFile } from './errorsFile'

export class logManager {
  constructor(owner) {
    this.owner = owner;
    this.eventEmitter = owner.conf.get('eventEmitter');
    this.options = owner.conf.get('options');
    this.logger = getColor();

    this.downloadEvents();
    this.zipEvents();
    this.streamEvents();
    this.errorsEdit();
    this.errorsFile();
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

  errorsEdit(){
    return errorsEdit(this.options, this.eventEmitter, this.logger)
  }

  errorsFile(){
    return errorsFile(this.options, this.eventEmitter, this.logger)
  }


}
