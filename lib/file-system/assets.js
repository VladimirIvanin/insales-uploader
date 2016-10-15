import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import mkdirp from 'mkdirp';
import { writeFile } from '../file-system/file';
import { getFileInfo,
         getContent } from '../file-system/watch';
import { updateteAssets } from '../request/asset';
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

export function pushTheme(paths, assets, owner) {
  return new Promise(function (resolve, reject) {
    if (_.size(assets) > 0) {
      searchDiffAssets(paths, assets, function (_errorList, _localError, _localPaths) {
        pushAssets(owner, _errorList, _localError, _localPaths, assets).then(function () {
          console.log(log_notice('Pushed!'));
          resolve();
        });
      });
    }else{
      updateteAssets(owner).then(function () {
        searchDiffAssets(paths, owner.assets, function (_errorList, _localError, _localPaths) {
          pushAssets(owner, _errorList, _localError, _localPaths, assets).then(function () {
            console.log(log_notice('Pushed!'));
            resolve();
          })
        });
      }, function () {
        resolve();
      })
    }
  })
}

export function pushAssets(owner, errorList, localError, _localPaths, assets) {
  return new Promise(function (resolve, reject) {
  const editAssets = _.pick(assets, _localPaths);
  let localErrorSize = _.size(localError);
  let errorListSize = _.size(errorList);
  let editAssetsSize = _.size(editAssets);
  const totalSize = localErrorSize + errorListSize + editAssetsSize;
  const _task = {
    action: 'push'
  }

  console.log();
  const statusBar = new ProgressBar('Push [:bar] :percent', {
    complete: '█',
    incomplete: '.',
    width: 20,
    clear: true,
    total: 3
  });

  removeAssetRun(localErrorSize - 1).then(function () {
    statusBar.tick();
    uploadAssetRun(errorListSize - 1).then(function () {
      statusBar.tick();
      editAssetRun(editAssetsSize -1).then(function () {
        statusBar.tick();
        resolve();
      })
    })
  })

  function removeAssetRun(_localErrorSize) {
    return new Promise(function (resolve, reject) {
      if (_localErrorSize <= 0) {
        resolve();
      }else{
        _.forEach(localError, function (asset, localErrorIndex) {
          _task['count'] = localErrorIndex;
          owner.removeAsset(owner, asset.id, false, asset.name, _task).then(function() {
            if (_localErrorSize == localErrorIndex) {
              resolve();
            }
          })

        })
      }
    })
  }

  function uploadAssetRun(_errorListSize) {
    return new Promise(function (resolve, reject) {
      if (_errorListSize <= 0) {
        resolve()
      }else{
        _.forEach(errorList, function (_file, errorListIndex) {
          _task['count'] = errorListIndex;
          getFileInfo(_file.path, owner.options.theme.root, owner.paths).then(function(_info) {
            let _content = getContent(_info.isBinary, _info.data, _info.name, _info.type);
            owner.uploadAsset(owner, _content.upload, _file.path, _task).then(function () {
              if (errorListIndex == _errorListSize) {
                resolve();
              }
            })
          })
        })
      }
    })
  }

  function editAssetRun(_editAssetsSize) {
    return new Promise(function (resolve, reject) {
    if (_editAssetsSize <= 0) {
      resolve()
    }else{
      let editAssetsIndex = 0;
      _.forEach(editAssets, function (_file) {
        _task['count'] = editAssetsIndex;
        getFileInfo(_file.path, owner.options.theme.root, owner.paths).then(function(_info) {
          let _content = getContent(_info.isBinary, _info.data, _info.name, _info.type);
          owner.editAsset(owner, _content.asset, _file.id ,_file.path, _task).then(function () {
            if (editAssetsIndex == _editAssetsSize) {
              resolve()
            }
            editAssetsIndex++;
          })
        })
      })
    }
  })
  }
})
}
