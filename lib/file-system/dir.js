import mkdirp from 'mkdirp';
import { instance } from '../instance';
import _ from 'lodash';

export function createDir(_owner, action) {
  const _instance = _owner.instance;
  _.forEach(_instance.folders, function(el, index) {
    mkdirp(el)
  });
  if (action.method === 'backup' || _owner.options.startBackup) {
    _.forEach(_instance.assets, function(el, index) {
      mkdirp(el.backup)
    });
  }
}
