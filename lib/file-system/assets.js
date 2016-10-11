import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import mkdirp from 'mkdirp';
import { writeFile } from '../file-system/file';
import { updateteAssets } from '../request/asset';
import { getAssetPath } from '../patch';
import isBinaryFile from 'isbinaryfile';
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

export function initAssets(paths) {
  return new Promise(function (resolve, reject) {
  const media_root = path.normalize(paths.folders.media_root);
  const files = fs.readdirSync(media_root);
  _.forEach(paths.folders, function(el, index) {
    mkdirp(el)
  });
  _.forEach(files ,function (fileName) {
    var pathNormal = path.normalize(media_root + fileName);
    var pathParse = path.parse(pathNormal);
    var _ext = pathParse.ext;
    var _filePathAsset = getAssetPath(paths, 'Asset::Media', fileName, _ext);
    var _task = {
      message: `move ${fileName} => ${_filePathAsset}`
    }
    if (!isBinaryFile.sync(pathNormal)) {
      var _encode = 'utf8';
    }else{
      var _encode = 'base64';
    }
    fs.readFile(pathNormal, (err, data) => {
      if (err) throw err;
      var _data = data.toString(_encode);
      writeFile(_filePathAsset, _data, _encode, _task);
    })
  })

  resolve();
  })
}

function searchDiffAssets(paths, assets, setError) {
  var _folders = paths.foldersDefaults;
  var _errorList = [];
  var _localError = [];
  var _localPath = [];
  var _folderSize = _.size(_folders);
  var _count = 0;
  _.forEach(_folders, function (folder) {
    fs.readdir(folder, function(err, list) {
      var _listSize = list.length - 1;
      if (err) {
        console.log(err);
        setError(_errorList)
      }
      if (list.length === 0) {
        _count++
      }else{
        _.forEach(list, function (_name, index) {
          var _fullPath = path.normalize(folder + _name);
          _localPath.push(_fullPath)
          if ( _.isUndefined(assets[_fullPath]) ) {
            _errorList.push({
              name: _name,
              path: _fullPath
            })
          }
          if (index === _listSize) {
            _count++
          }
          if (index === _listSize && _count === _folderSize) {
            var _omit = _.omit(assets, _localPath);
            var _omitSize = _.size(_omit) - 1;
            if (_omitSize >= 0) {
              _.forEach(_omit, function (_asset, ind) {
                _localError.push({
                  name: _asset.name
                });
              })
              setError(_errorList, _localError)
            }else{
              setError(_errorList)
            }
          }
        })
      }
    })
  })
}

function consoleDiff(errorList, localError) {
  if (localError) {
    console.warn(log_error('Внимание, в локальной версии отсутствуют следующие файлы:'));
    _.forEach(localError, function (err) {
      console.log(log_warn2(err.name));
    })
  }
  if (errorList.length > 0) {
    console.warn(log_error('Внимание, на сервере отсутствуют следующие файлы:'));
    _.forEach(errorList, function (err) {
      console.log(log_warn2(err.name, ' => ', err.path));
    })
  }
}

export function diffLocalAssets(paths, assets, owner) {
  return new Promise(function (resolve, reject) {
    var _assetSize = _.size(assets);
    if (_assetSize > 0) {
      searchDiffAssets(paths, assets, function (_errorList, _localError) {
        consoleDiff(_errorList, _localError);
        resolve();
      });
    }else{
      updateteAssets(owner).then(function () {
        searchDiffAssets(paths, owner.assets, function (_errorList, _localError) {
          consoleDiff(_errorList, _localError);
          resolve();
        });
      }, function () {
        resolve();
      })
    }
  })
}
