import isBinaryFile from 'isbinaryfile';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import { getAsset,
         getAssets,
         upadeteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from '../request/asset';
import chokidar from 'chokidar';

export function _watch(_owner, event, _path) {

  var pathNormal = path.normalize(_path);
  var pathParse = path.parse(pathNormal);
  var _fileName = pathParse.base;
  var _dirPath = pathParse.dir;
  var _folderParent = _.last(_dirPath.split(path.sep));
  var _assetType = _.findKey(_owner.instance.assets, function(o) { return o.folder.indexOf(_folderParent) > -1  }) || 'Asset::Media';

  if (/\s/g.test(_path)) {
    console.info(`Недопустимое имя файла - ${_fileName}`)
    throw new Error('Удалите пробелы в названии файла.');
  }

  if (!(event === 'unlink')) {

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

      if (_owner.assets[_fileName]) {
        var _id = _owner.assets[_fileName].id;
        if (_id) {
          editAsset(_owner, _content.asset, _id, _path)
        }
      }

      if (!_owner.assets[_fileName]) {

        uploadAsset(_owner, _content.upload, _path).then(function () {
          upadeteAssets(_owner);
        }, function () {
          upadeteAssets(_owner);
        });
      }
    });
  }

  if (event === 'unlink') {
    if (_owner.assets[_fileName]) {
      var _id = _owner.assets[_fileName].id;
      if (_id) {
        removeAsset(_owner, _id, _path, _fileName).then(function () {
          upadeteAssets(_owner)
        }, function () {
          upadeteAssets(_owner);
        });
      }
    }
  }
}

export function watcher(_owner) {
  console.info('Start watch');
  chokidar.watch(_owner.instance.toWatch, {ignored: /[\/\\]\./, ignoreInitial: true}).on('all', (event, _path) => {
    _watch(_owner, event, _path);
  });
}

function getContent(_isBinary, _data, _fileName, _assetType) {
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
