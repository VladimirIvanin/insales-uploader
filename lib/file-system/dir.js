import mkdirp from 'mkdirp';
import rmdir from 'rmdir';
import zipdir from 'zip-dir';
import fs from 'fs';
import path from 'path';
import { instance } from '../instance';
import _ from 'lodash';
import Promise from 'promise';

export function createDir(_owner, action) {
  return new Promise(function (resolve, reject) {
    const _instance = _owner.instance;
    _.forEach(_instance.folders, function(el, index) {
      mkdirp(el)
    });
    if (action.method === 'backup' || _owner.options.theme.startBackup) {
      _.forEach(_instance.assets, function(el, index) {
        rmdir(el.backup, function (err, dirs, files) {
          mkdirp(el.backup);
        });
      });
    }
    resolve();
  });
}

export function reloadDir(_owner, action) {
  return new Promise(function (resolve, reject) {
    const _instance = _owner.instance;
    if (action.method === 'backup') {
      _.forEach(_instance.assets, function(el, index) {
        rmdir(el.backup, function (err, dirs, files) {
          mkdirp(el.backup);
        });
      });
    }
    resolve();
  });
}

export function zippedDir(_owner, _path, _save_to, _filter) {
  return new Promise(function (resolve, reject) {
    var _today = new Date;
    var _date = `${_today.getFullYear()}-${_today.getMonth()}-${_today.getDate()}-${_today.getHours()}-${_today.getMinutes()}`

    console.info(`start zip ${_save_to}-${_date}.zip`);
    const _pathDir = path.normalize(_path);
    const _option = { saveTo: `${_pathDir}/${_save_to}-${_date}.zip` }

    if (_filter) {
      _option['filter'] = function (pathDirs, stat) {
        var _key = _.findKey(_owner.instance.assets, function(o) {
          var _pathNorm = path.normalize(o[_filter]).slice(0, -1);
          return pathDirs.indexOf(_pathNorm) > -1;
        })
        if (_key) {
          return true;
        }else{
          return false;
        }
      }
    }

    zipdir(_pathDir, _option, function (err, buffer) {
      if (err) {
        console.log(err)
      }else{
        console.info(`finish zip ${_save_to}-${_date}.zip`);
      }
      resolve();
    });
  });
}
