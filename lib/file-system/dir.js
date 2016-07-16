import mkdirp from 'mkdirp';
import { instance } from '../instance';
import _ from 'lodash';

export function createDir(_owner) {
  const _instance = _owner.instance;
  _.forEach(_instance.folders, function(el, index) {
    mkdirp(el)
  });
  if (_owner.options.backup) {
    _.forEach(_instance.assets, function(el, index) {
      mkdirp(el.backup)
    });
  }
}
