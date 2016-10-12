import isBinaryFile from 'isbinaryfile';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import { setQueueAsset } from '../request/assetManager';
import { updateteAssets } from '../request/asset';
import { writeFile } from '../file-system/file';
import { getAssetPath } from '../patch';
import chokidar from 'chokidar';
const jsdiff = require('diff');
import clc from 'cli-color';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

export function _watch(_owner, event, _path) {

  var pathNormal = path.normalize(_path);
  var pathMedia = path.normalize(_owner.options.theme.root+'/media');
  var pathParse = path.parse(pathNormal);
  var _fileName = pathParse.base;
  var _ext = pathParse.ext;
  var _dirPath = pathParse.dir;
  var _folderParent = _.last(_dirPath.split(path.sep));
  var _assetType = _.findKey(_owner.paths.assets, function(o) { return o.folder.indexOf(_folderParent) > -1  }) || 'Asset::Media';
  var isMediaFile = true;
  var _mediaFilePath = '';
  var _filePathAsset = '';

  if (_assetType === 'Asset::Media' && _dirPath.indexOf(pathMedia) < 0 ) {
    var isMediaFile = false;
    _mediaFilePath = path.normalize(pathMedia + '/' + _fileName);
  }

  if (/\s/g.test(_path)) {
    console.info(`Недопустимое имя файла - ${_fileName}`)
    throw new Error('Удалите пробелы в названии файла.');
  }

  if (!(event === 'unlink') && event) {

    if (!isBinaryFile.sync(_path)) {
      var _encode = 'utf8';
      var _isBinary = false;
    }else{
      var _encode = 'base64';
      var _isBinary = true;
    }

    fs.readFile(_path, (err, data) => {
      if (err) throw err;
      var _data = data.toString(_encode)

      var _content = getContent(_isBinary, _data, _fileName, _assetType);

      var _task = {
        unlink: false,
        event
      };
      if (isMediaFile) {
        if (_assetType === 'Asset::Media') {
          var _filePathAsset = getAssetPath(_owner.paths, _assetType, _fileName, _ext);
          fs.readFile(_filePathAsset,  (_err, newData) => {
            if (_err){
              setQueueAsset(_owner, _content, _path, _task, _fileName);
              writeFile(_filePathAsset, _data, _encode, _task)
            }else{
              setQueueAsset(_owner, _content, _path, _task, _fileName);
              var stats1 = fs.statSync(_filePathAsset)
              var stats2 = fs.statSync(_path)
              var fileSizeInBytes1 = _.toNumber(stats1["size"]);
              var fileSizeInBytes2 = _.toNumber(stats2["size"]);
              if (fileSizeInBytes1 === fileSizeInBytes2) {
                  var difa = jsdiff.diffChars(newData.toString(_encode), _data);
                  var difSize = _.size(difa);
                  if (difSize > 1) {
                    writeFile(_filePathAsset, _data, _encode, _task)
                  }
              }else{
                writeFile(_filePathAsset, _data, _encode, _task)
              }
            }
          });
        }else{
          setQueueAsset(_owner, _content, _path, _task, _fileName);
        }
      }else{
        fs.readFile(_mediaFilePath,  (_err, newData) => {
          if (_err) {
            writeFile(_mediaFilePath, _data, _encode, _task)
          }else{
            var stats1 = fs.statSync(_mediaFilePath)
            var stats2 = fs.statSync(_path)
            var fileSizeInBytes1 = stats1["size"];
            var fileSizeInBytes2 = stats2["size"];
            if (fileSizeInBytes1 === fileSizeInBytes2) {
              if (!_isBinary) {
              var difa = jsdiff.diffChars(_data, newData.toString(_encode));
              var difSize = _.size(difa);
                if (difSize > 1) {
                  writeFile(_mediaFilePath, _data, _encode, _task)
                }
              }
            }else{
              writeFile(_mediaFilePath, _data, _encode, _task)
            }
          }
        })
      }
    });
  }

  if (event === 'unlink') {
    var _task = {
      unlink: true,
      event
    };
    var _content = getContent(false, '', _fileName, _assetType);
    var _filePathAsset = getAssetPath(_owner.paths, _assetType, _fileName, _ext);
    if (isMediaFile) {
      setQueueAsset(_owner, _content, _path, _task, _fileName)
      fs.stat(_filePathAsset, function (err, stats) {
        if (!err) {
            fs.unlink(_filePathAsset,function(err){
              if(err) return console.log(err);
            });
        }
      });
    }else{
      fs.stat(_mediaFilePath, function (err, stats) {
        if (!err) {
            fs.unlink(_mediaFilePath,function(err){
              if(err) return console.log(err);
            });
        }
      });
    }
  }
}

export function triggerFile(_owner, event, _path) {
    return new Promise(function (resolve, reject) {
      var normalPathRoot = path.normalize(_owner.options.theme.root);
      var pathParseRoot = path.parse(normalPathRoot);
      var normalPath = path.normalize(_path);
      var pathParse = path.parse(normalPath);
      var pathParseDir = path.normalize(pathParse.dir);
      var pathParseRootDir = path.normalize(pathParseRoot.dir);
      var pathParseRootBase = path.normalize(pathParseRoot.base);
      if (pathParseDir.indexOf(path.sep +'assets' + path.sep) > -1) {
        var assetPath = _.head(pathParse.dir.split('assets' + path.sep))
        pathParseDir = assetPath + 'media'
      }
      var newPaty = _.last(pathParseDir.split(pathParseRootDir))
      var newPatyLast = _.last(newPaty.split(pathParseRootBase))
      var resultKey = path.normalize(normalPathRoot + newPatyLast + path.sep + pathParse.base);

      if (_.size(_owner.assets) == 0) {
        _owner.updateteAssets(_owner).then(function () {
          _watch(_owner, event, resultKey);
          resolve();
        })
      }else{
        _watch(_owner, event, resultKey);
        resolve();
      }
    })
}
export function watcher(_owner) {

  var _options = {
    ignored: /[\/\\]\./,
    ignoreInitial: true,
    followSymlinks: true,
    usePolling: true,
    interval: 100,
    binaryInterval: 300,
    alwaysStat: false,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    },
    ignorePermissionErrors: false
  }

  chokidar.watch(_owner.paths.toWatch, _options).on('all', (event, _path) => {
     _watch(_owner, event, _path);
  });

}

export function getContent(_isBinary, _data, _fileName, _assetType) {
  let _content = {}

  _content.asset = {};
  _content.upload = {
    'name': _fileName,
    'type': _assetType
  }

  if (_isBinary) {
    _content.asset['attachment'] = _data;
    _content.upload['attachment'] = _data;

  }else{
    let dataReplace = remove_etx(_data, _fileName);
    _content.asset['content'] = dataReplace
    _content.upload['content'] = dataReplace;
  }

  return _content;
}

function remove_etx(str, name) {

  if ((str===null) || (str===''))
       return '';
 else
   str = str.toString();
   let searchRegExp = /\x03/g;
   if (searchRegExp.test(str)) {
     console.log(log_warn(`Удалите спецсимвол \\u0003 из файла ${name}`));
     str = str.replace(/\x03/g, '');
   }
  return str;
}

export function uploadAssets(owner, param) {
  if (!param) {
    var param = {
      update: false
    }
  }else{
    if (!param.update) {
      param.update = false
    }
  }
  updateteAssets(owner).then(function () {
  var _folders = owner.paths.foldersDefaults;
  var _folderSize = _.size(_folders);
  var _count = 0;
  _.forEach(_folders, function (folder) {
    fs.readdir(folder, function(err, list) {
      var _listSize = list.length - 1;
      if (err) {
        console.log(err);
      }
      if (list.length > 0) {
        _.forEach(list, function (_name, index) {
          var _fullPath = path.normalize(folder + _name);
          if ( _.isUndefined(owner.assets[_fullPath]) || param.update ) {
            var pathParse = path.parse(_fullPath);
            var _fileName = pathParse.base;
            var _ext = pathParse.ext;
            var _dirPath = pathParse.dir;
            var _folderParent = _.last(_dirPath.split(path.sep));
            var _assetType = _.findKey(owner.paths.assets, function(o) { return o.folder.indexOf(_folderParent) > -1  }) || 'Asset::Media';

            if (!isBinaryFile.sync(_fullPath)) {
              var _encode = 'utf8';
              var _isBinary = false;
            }else{
              var _encode = 'base64';
              var _isBinary = true;
            }

            fs.readFile(_fullPath, (err, data) => {
              if (err) throw err;
              var _data = data.toString(_encode)

              var _content = getContent(_isBinary, _data, _name, _assetType);

              var _task = {
                unlink: false,
                event: 'add'
              };
              setQueueAsset(owner, _content, _fullPath, _task, _name);
              if (index === _listSize) {
                _count++
              }
              if (index === _listSize && _count === _folderSize) {
                //console.log('2finish');
              }
            })
          }else{
            if (index === _listSize) {
              _count++
            }
            if (index === _listSize && _count === _folderSize) {
              //console.log('1finish');
            }
          }
        })
      }else{
        _count++
        if (_count === _folderSize) {
          //console.log('3finish');
        }
      }
    })
  })
  })
}
