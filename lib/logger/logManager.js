'use strict';
import _ from 'lodash';
import { getColor } from './colors'
import { downloadEvents } from './themeDownload'
import { zipEvents } from './themeZip'
import { streamEvents } from './themeStream'
import { errorsEdit } from './errorsEdit'
import { errorsFile } from './errorsFile'
import { errorsCSS } from './errorsCSS'
import { errorsJs } from './errorsJs'

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
    this.errorsCSS();
    this.errorsJs();
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

  errorsCSS(){
    return errorsCSS(this.options, this.eventEmitter, this.logger)
  }

  errorsJs(){
    return errorsJs(this.options, this.eventEmitter, this.logger)
  }


}
