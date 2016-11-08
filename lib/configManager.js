'use strict';
import _ from 'lodash';

export class configManager {
  constructor(owner) {
    this.owner = owner;
  }

  get(key){
    if (this.owner[key]) {
      return this.owner[key];
    }else{
      console.log(`Свойство ${key} отсутствует`);
      return;
    }
  }

  set(key, value){
    this.owner[key] = value || {};
    return;
  }
}
