import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import rmdir from 'rmdir';
import mkdirp from 'mkdirp';
import { writeFile } from '../file-system/file';
import { getFileInfo,
         getContent } from '../file-system/watch';
import { updateteAssets } from '../request/asset';
import { setQueueAsset } from '../request/assetManager';
import { getAssetPath } from '../patch';
import isBinaryFile from 'isbinaryfile';
import clc from 'cli-color';
import ProgressBar from 'progress';

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
}

export function diffLocalAssets(paths, assets, owner) {
  return new Promise(function (resolve, reject) {
    var _assetSize = _.size(assets);
    if (_assetSize > 0) {
      searchDiffAssets(paths, assets, function (_errorList, _localError) {
        consoleDiff(_errorList, _localError);
        resolve();
      }, function (err) {
        console.log(err);
      });
    }else{
      updateteAssets(owner).then(function () {
        searchDiffAssets(paths, owner.assets, function (_errorList, _localError) {
          consoleDiff(_errorList, _localError);
          resolve();
        });
      }, function (err) {
        console.log(err);
        resolve();
      })
    }
  })
}

export function pullTheme(owner, paths) {
  return new Promise(function (resolve, reject) {
    var folderSize = _.size(paths.folders);
    var _count = 1;
    _.forEach(paths.folders, function (folderAsset) {
      rmdir(folderAsset, function (err, dirs, files) {
        mkdirp(folderAsset, function (err) {
          if (err) console.error(err)
          if (folderSize === _count) {
            setTimeout(function () {
              owner.download().then(function () {
                resolve()
              });
            }, 500)
          }
          _count++
        });
      });
    });
  });
}

export function pushTheme(paths, assets, owner) {
    if (_.size(assets) > 0) {
      searchDiffAssets(paths, owner.assets, function (_errorList, _localError, _localPaths) {
        pushAssets(owner, _errorList, _localError, _localPaths, owner.assets).then(function (pushList) {
          setQueuePushList(owner, pushList);
        });
      });
    }else{
      updateteAssets(owner).then(function () {
        searchDiffAssets(paths, owner.assets, function (_errorList, _localError, _localPaths) {
          pushAssets(owner, _errorList, _localError, _localPaths, owner.assets).then(function (pushList) {
            setQueuePushList(owner, pushList);
          })
        });
      })
    }
}

export function setQueuePushList(_owner, pushList) {
  return new Promise(function (resolve, reject) {
    const _total = _.size(pushList);
    const _cancel = _total - 1;
    _owner.state.uploaded = true;
    _owner.state.uploadedSize = _total;
    console.log('Start upload theme');
    _owner.queueList = [];
    _.forEach(pushList, function (_asset, _index) {
      setQueueAsset(_owner, _asset.content, _asset.path, _asset.task, _asset.name);
    })
  })
}

export function pushAssets(owner, errorList, localError, _localPaths, assets) {
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
      unlink: true,
      action: 'push'
    }
    return new Promise(function (resolve, reject) {
      if (_localErrorSize < 0) {
        resolve(pushList);
      }else{
        _.forEach(localError, function (asset, localErrorIndex) {
          const _item = {};
          _item.path = asset.path;
          _item.task = localTask;
          _item.name = asset.name;
          getFileInfo(asset.path, owner.options.theme.root, owner.paths, _item.task).then(function(_info) {
            let _content = getContent(_info.isBinary, _info.data, _info.name, _info.type);
            _item.content = _content;
            if (_item.name == 'messages.json' || _item.name == 'setup.json') {
              _item.task = {
                event: 'change',
                unlink: false,
                action: 'push'
              };
              _content = getContent(_info.isBinary, '', _info.name, _info.type);
              _item.content = _content;
            }
            pushList.push(_item);
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
          _item.path = _file.path;
          _item.task = localTask;

          getFileInfo(_file.path, owner.options.theme.root, owner.paths, _item.task).then(function(_info) {
            let _content = getContent(_info.isBinary, _info.data, _info.name, _info.type);
            _item.name = _info.name;
            _item.content = _content;
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
        _item.path = _file.pathKey;
        _item.task = localTask;

        getFileInfo(_file.pathKey, owner.options.theme.root, owner.paths).then(function(_info) {
          let _content = getContent(_info.isBinary, _info.data, _info.name, _info.type);
          _item.name = _info.name;
          _item.content = _content;
          if (owner.assets[_item.path]) {
            if (_info.isBinary) {
              var _itemUnlink = _.cloneDeep(_item);
              var _itemAdd = _.cloneDeep(_item);
              _itemUnlink.task.event = 'unlink';
              _itemUnlink.task.unlink = true;
              pushList.push(_itemUnlink);
              _itemAdd.task.unlink = false;
              _itemAdd.task.event = 'add';
              pushList.push(_itemAdd);
            }else{
              var _itemUnlink = _.cloneDeep(_item);
              var _itemAdd = _.cloneDeep(_item);
              if (_itemUnlink.content.asset.content.indexOf('require') > -1) {
                _itemUnlink.task.event = 'unlink';
                _itemUnlink.task.unlink = true;
                pushList.push(_itemUnlink);
                _itemAdd.task.unlink = false;
                _itemAdd.task.event = 'add';
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