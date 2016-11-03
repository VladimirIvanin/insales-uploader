'use strict';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import rmdir from 'rmdir';
import mkdirp from 'mkdirp';
import { writeFile } from '../file-system/file';
import { getFileInfo,
         getContent } from '../file-system/watch';
import { getAsset,
         getAssets,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from '../request/asset';
import { setQueueAsset } from '../request/assetManager';
import { getAssetPath } from '../paths';
import { downloadTheme,
         streamTheme,
         backupTheme } from '../interface';
import isBinaryFile from 'isbinaryfile';
import clc from 'cli-color';
import delay from 'delay';
import ProgressBar from 'progress';
import TaskManager from '../taskManager';

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
    var _filePathAsset = getAssetPath(paths, 'Asset::Media', fileName, _ext, {isAssetsPath: true });
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
      if (!list) {
        list = [];
        console.log(log_error(`Неверно указан путь к теме`))
      }

      var _listSize = list.length - 1;
      if (err) {
        console.log(err);
        setError(_errorList, _localError, _localPath)
      }
      if (list.length <= 0) {
        _count++
        if (_count === _folderSize) {
          var _omit = _.omit(assets, _localPath);
          var _omitSize = _.size(_omit) - 1;
          if (_omitSize >= 0) {
            _.forEach(_omit, function (_asset, ind) {
              _localError.push({
                name: _asset.name,
                path: _asset.pathKey,
                id: _asset.id
              });
            })
            setError(_errorList, _localError, _localPath)
          }else{
            setError(_errorList, _localError, _localPath)
          }
        }
      }else{

        _.forEach(list, function (_name, index) {

          var _tempIndex = index;
          var _fullPath = path.normalize(folder + _name);
          _localPath.push(_fullPath)

          if ( _.isUndefined(assets[_fullPath]) ) {
            _errorList.push({
              name: _name,
              path: _fullPath
            })
          }

          if (_tempIndex === _listSize) {
            _count++
          }

          if (index === _listSize && _count === _folderSize) {
            var _omit = _.omit(assets, _localPath);
            var _omitSize = _.size(_omit) - 1;
            if (_omitSize >= 0) {
              _.forEach(_omit, function (_asset, ind) {
                _localError.push({
                  name: _asset.name,
                  path: _asset.pathKey,
                  id: _asset.id
                });
              })
              setError(_errorList, _localError, _localPath)
            }else{
              setError(_errorList, _localError, _localPath)
            }
          }
        })
      }
    })
  })
}

function consoleDiff(errorList, localError) {
  if (_.size(localError) > 0) {
    console.warn(log_error('Внимание, в локальной версии отсутствуют следующие файлы:'));
    _.forEach(localError, function (err) {
      console.log(log_warn2(err.name));
    })
  }
  if (_.size(errorList) > 0) {
    console.warn(log_error('Внимание, на сервере отсутствуют следующие файлы:'));
    _.forEach(errorList, function (err) {
      console.log(log_warn2(err.name, ' => ', err.path));
    })
  }
  if (_.size(errorList) === 0 && _.size(localError) === 0) {
    console.warn(log_notice('Список файлов на сервере совпадает с локальной версией'));
  }
}

export function diffLocalAssets(conf, state) {
  const options = conf.get('options');
  const paths = conf.get('paths');

  return new Promise(function (resolve, reject) {
    updateteAssets(conf, state).then(function () {
      const assets = conf.get('assets');
      searchDiffAssets(paths, assets, function (_errorList, _localError) {
        consoleDiff(_errorList, _localError);
        resolve();
      });
    }, function (err) {
      console.log(err);
      resolve();
    })
  })
}

export function pullTheme(conf, state) {
  const paths = conf.get('paths');
  return new Promise(function (resolve, reject) {
    var folderSize = _.size(paths.folders);
    var _count = 1;
    _.forEach(paths.folders, function (folderAsset) {
        rmdir(folderAsset, function (err, dirs, files) {
        _.delay(() => {
          mkdirp(folderAsset, function (err) {
            if (err) console.error(err)
            if (folderSize === _count) {
              _.delay(() => {
                downloadTheme(conf, state).then(function () {
                  resolve()
                });
              }, 500)
            }
            _count++
          })
        }, 1500);
      });
    });
  });
}

const uploadManager = new TaskManager({
  delay: 0,
  statusBar: {
    template: 'Uploads: [:bar] :percent'
  }
});

export function pushTheme(conf, state) {
  const paths = conf.get('paths');

  uploadManager.createTask('upload', function (fileInfo) {
    let task = fileInfo.task || {};
    let assets = conf.get('assets');

    return new Promise(function(resolve, reject) {
      updateteAssets(conf, state).then(() => {
        let assets = conf.get('assets');

        // Удаление
        if ( _.isEqual(fileInfo.event, 'unlink') ) {
          if (assets[fileInfo.path]) {
            removeAsset(conf, state, assets[fileInfo.path].id, fileInfo.path, fileInfo.name, task).then(()=>{
              resolve();
            }).catch(() =>{
              resolve();
            })
          }else{
            resolve();
          }
        }

        // upload
        if (_.isEqual(fileInfo.event, 'add') && !assets[fileInfo.path]) {
          uploadAsset (conf, state, fileInfo.content.upload, fileInfo.path, task).then(()=>{
            resolve();
          }).catch(() =>{
            resolve();
          })
        }

        // edit
        if (!_.isEqual(fileInfo.event, 'unlink')) {
          if (assets[fileInfo.path]) {
            editAsset (conf, state, fileInfo.content.asset, assets[fileInfo.path].id, fileInfo.path, task).then(()=>{
              resolve();
            }).catch(() =>{
              resolve();
            })
          }
        }
      });
    });
  });

  updateteAssets(conf, state).then(function () {
    let assets = conf.get('assets');
    searchDiffAssets(paths, assets, function (_errorList, _localError, _localPaths) {
      pushAssets(conf, state, _errorList, _localError, _localPaths, assets).then(function (pushList) {
        let listTask = _.reduce(pushList, function(result, value, key) {
          let _result = {
            task: 'upload',
            param: value
          }
          result.push(_result)
          return result;
        }, []);

        console.log('Start upload theme');
        uploadManager.addTaskList(listTask).then(() => {
          console.log('Upload done');
        });
      })
    });
  })
}

export function pushAssets(conf, state, errorList, localError, _localPaths, assets) {
  const paths = conf.get('paths');
  const options = conf.get('options');

  return new Promise(function (resolve, reject) {
  const editAssets = _.pick(assets, _localPaths);
  let localErrorSize = _.size(localError);
  let errorListSize = _.size(errorList);
  let editAssetsSize = _.size(editAssets);
  const totalSize = localErrorSize + errorListSize + editAssetsSize;
  const pushListStart = [];

  removeAssetRun(localErrorSize - 1, pushListStart).then(function (_pushList1) {
    uploadAssetRun(errorListSize - 1, _pushList1).then(function (_pushList2) {
      editAssetRun(editAssetsSize -1, _pushList2).then(function (_pushList3) {
        resolve(_pushList3);
      })
    })
  })

  function removeAssetRun(_localErrorSize, _pushList) {
    var pushList = _pushList || [];
    var localTask = {
      event: 'unlink',
      action: 'push'
    }

    return new Promise(function (resolve, reject) {
      if (_localErrorSize < 0) {
        resolve(pushList);
      }else{
        _.forEach(localError, function (asset, localErrorIndex) {
          const _item = {};
          _item.task = localTask;

          getFileInfo(asset.path, paths, 'unlink').then(function(_info) {
            _.merge(_item, _info);
            let _content = getContent(_info, 'unlink');
            _item.event = 'unlink';
            _item.content = _content;
            if (_item.name == 'messages.json' || _item.name == 'setup.json') {
              //
            }else{
              pushList.push(_item);
            }
            if (_localErrorSize == localErrorIndex) {
              resolve(pushList);
            }
          });
        })
      }
    })
  }

  function uploadAssetRun(_errorListSize, _pushList) {
    var pushList = _pushList || [];
    var localTask = {
      event: 'add',
      unlink: false,
      action: 'push'
    }
    return new Promise(function (resolve, reject) {
      if (_errorListSize < 0) {
        resolve(pushList)
      }else{
        _.forEach(errorList, function (_file, errorListIndex) {
          const _item = {};
          _item.task = localTask;

          getFileInfo(_file.path, paths, 'add').then(function(_info) {
            _.merge(_item, _info);
            let _content = getContent(_info);
            _item.content = _content;
            _item.event = 'add';
            pushList.push(_item);
            if (errorListIndex == _errorListSize) {
              resolve(pushList);
            }
          })
        })
      }
    })
  }

  function editAssetRun(_editAssetsSize, _pushList) {
    var pushList = _pushList || [];
    var localTask = {
      event: 'change',
      unlink: false,
      action: 'push'
    }

    return new Promise(function (resolve, reject) {
    if (_editAssetsSize < 0) {
      resolve(pushList)
    }else{
      let editAssetsIndex = 0;
      _.forEach(editAssets, function (_file) {
        const _item = {};
        _item.task = localTask;

        getFileInfo(_file.pathKey, paths, 'change').then(function(_info) {
          _.merge(_item, _info);
          let _content = getContent(_info, 'change');
          _item.name = _info.name;
          _item.event = 'change';
          _item.content = _content;
          if (assets[_item.path]) {
            if (_info.isBinary) {
              var _itemUnlink = _.cloneDeep(_item);
              var _itemAdd = _.cloneDeep(_item);
              _itemUnlink.task.event = 'unlink';
              _itemUnlink.event = 'unlink';
              _itemUnlink.task.unlink = true;
              pushList.push(_itemUnlink);
              _itemAdd.task.unlink = false;
              _itemAdd.task.event = 'add';
              _itemAdd.event = 'add';
              pushList.push(_itemAdd);
            }else{
              var _itemUnlink = _.cloneDeep(_item);
              var _itemAdd = _.cloneDeep(_item);
              if (_itemUnlink.content.asset.content.indexOf('require') > -1) {
                _itemUnlink.task.event = 'unlink';
                _itemUnlink.event = 'unlink';
                _itemUnlink.task.unlink = true;
                pushList.push(_itemUnlink);
                _itemAdd.task.unlink = false;
                _itemAdd.task.event = 'add';
                _itemAdd.event = 'add';
                pushList.push(_itemAdd);
              }else{
                pushList.push(_item);
              }
            }
          }else{
            pushList.push(_item);
          }
          if (editAssetsIndex == _editAssetsSize) {
            resolve(pushList)
          }
          editAssetsIndex++;
        })
      })
    }
  })
  }
})
}
