import mkdirp from 'mkdirp';
import rmdir from 'rmdir';
import zipdir from 'zip-dir';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import Promise from 'promise';
import clc from 'cli-color';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_warn2 = clc.xterm(208);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);
const log_label = clc.xterm(81);
const log_text = clc.xterm(254);
const log_start = clc.xterm(129);

export function createDir(paths, options, action) {
  return new Promise(function (resolve, reject) {
    _.forEach(paths.folders, function(el, index) {
      mkdirp(el)
    });

    if (action.method === 'backup' || options.theme.startBackup) {
      _.forEach(paths.assets, function(el, index) {
        rmdir(el.backup, function (err, dirs, files) {
          mkdirp(el.backup);
        });
      });
    }

    resolve();
  });
}

export function reloadDir(paths, action) {
  return new Promise(function (resolve, reject) {
    if (action.method === 'backup') {
      _.forEach(paths.assets, function(el, index) {
        rmdir(el.backup, function (err, dirs, files) {
          mkdirp(el.backup);
        });
      });
    }
    resolve();
  });
}

export function zippedDir(paths, _path, _save_to, _filter) {
  return new Promise(function (resolve, reject) {
    var _today = new Date;
    var _month = _today.getMonth() + 1;
    var _date = `${_today.getFullYear()}-${_month}-${_today.getDate()}-${_today.getHours()}-${_today.getMinutes()}`

    console.info(`start zip ${_save_to}-${_date}.zip`);
    const _pathDir = path.normalize(_path);
    const _option = { saveTo: `${_pathDir}/${_save_to}-${_date}.zip` }

    if (_filter) {
      _option['filter'] = function (pathDirs, stat) {
        var _key = _.findKey(paths.assets, function(o) {
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
        _.forEach(paths.assets, function(el, index) {
          rmdir(el.backup, function (err, dirs, files) {
          });
        });
        console.info(log_start(`finish zip ${_save_to}-${_date}.zip`));
      }
      resolve();
    });
  });
}
