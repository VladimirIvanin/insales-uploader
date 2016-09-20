import isBinaryFile from 'isbinaryfile';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import { setQueueAsset } from '../request/assetManager';
import { writeFile } from '../file-system/file';
import { getAssetPath } from '../patch';
import chokidar from 'chokidar';
const jsdiff = require('diff');

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
  var _content = {}

  _content.asset = {};
  _content.upload = {
    'name': _fileName,
    'type': _assetType
  }

  if (_isBinary) {
    _content.asset['attachment'] = _data;
    _content.upload['attachment'] = _data;

  }else{
    _content.asset['content'] = _data;
    _content.upload['content'] = _data;
  }

  return _content;
}
