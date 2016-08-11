import isBinaryFile from 'isbinaryfile';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import { setQueueAsset } from '../request/assetManager';
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

      setQueueAsset(_owner, _content, _path, _task)
    });
  }

  if (event === 'unlink') {
    var _task = {
      unlink: true,
      event
    };
    var _content = getContent(false, '', _fileName, _assetType);
    setQueueAsset(_owner, _content, _path, _task)
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
      stabilityThreshold: 2000,
      pollInterval: 100
    },
    ignorePermissionErrors: false
  }
  var _optionsChange = {
    ignored: /[\/\\]\./,
    ignoreInitial: true,
    followSymlinks: true,
    usePolling: true,
    interval: 100,
    binaryInterval: 300,
    alwaysStat: false,
    depth: 99,
    ignorePermissionErrors: false
  }

  var watcher = chokidar.watch(_owner.instance.toWatch, _optionsChange)
  var watcherChange = chokidar.watch(_owner.instance.toWatch, _optionsChange)

    watcher.on('add', _path => {
      _watch(_owner, 'add', _path);
    })
    .on('unlink', _path => {
      _watch(_owner, 'unlink', _path);
    });

    watcherChange.on('change', _path => {
      _watch(_owner, 'change', _path);
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
