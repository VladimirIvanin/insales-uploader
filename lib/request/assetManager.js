import { getAsset,
         getAssets,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from './asset';
import _ from 'lodash';
import fs from 'fs';
import Promise from 'promise';

export function setQueueAsset(_owner, _content, _path, _task, _fileName) {
    const _item = {};
    _item.path = _path;
    _item.task = _task;
    _item.name = _fileName;
    _item.content = _content;
    updateQueneList(_owner, _owner.queueList, _path, function () {
      _owner.queueList.push(_item);
      queueStart(_owner, _path);
    });
};

function queueStart(_owner, _path) {
  if (!_owner.inWork && _owner.queueList[0]) {
    recursionQueue(_owner).then(function() {
      _owner.inWork = false;
    },
    function() {
      _owner.inWork = false;
    })
  }
}

function updateQueneList(_owner, queueList, _path, cb) {
  var _removeQueue = _.remove(queueList, function(_queue, index) {
    var isRemove = true;
    if (index === 0) {
      isRemove = false;
    }
    return _queue.path == _path && isRemove;
  });
  cb()
}

function recursionQueue(_owner) {
  return new Promise(function (resolve, reject) {
    if (_owner.queueList[0]){
      _owner.inWork = true;
      _iterationQueue(_owner);
    }else{
      _owner.inWork = false;
      resolve();
    }

    function _iterationQueue(_owner) {
      if (!_owner.queueList[0]) {
        _owner.inWork = false;
        resolve();
      }

      if (_owner.queueList[0]) {
        var _queue = _owner.queueList[0];
        updateteAssets(_owner).then(function () {
          if (!_queue.task.unlink) {
            if (_owner.assets[_queue.path]) {
              editAsset (_owner, _queue.content.asset, _owner.assets[_queue.path].id, _queue.path).then(function() {
                _owner.queueList.splice(0, 1)
                if (_owner.queueList[0]) {
                  return _iterationQueue(_owner);
                }else{
                  resolve();
                }
              },
              function() {
                _owner.queueList.splice(0, 1)
                if (_owner.queueList[0]) {
                  return _iterationQueue(_owner);
                }else{
                  resolve();
                }
              })
            }else{
              uploadAsset (_owner, _queue.content.upload, _queue.path).then(function() {
                _owner.queueList.splice(0, 1)
                if (_owner.queueList[0]) {
                  return _iterationQueue(_owner);
                }else{
                  resolve();
                }
              },
              function() {
                _owner.queueList.splice(0, 1)
                if (_owner.queueList[0]) {
                  return _iterationQueue(_owner);
                }else{
                  resolve();
                }
              })
            }
          }

          if (_queue.task.unlink && _owner.assets[_queue.path]) {
            removeAsset(_owner, _owner.assets[_queue.path].id, _queue.path, _queue.name).then(function() {
              _owner.queueList.splice(0, 1)
              if (_owner.queueList[0]) {
                return _iterationQueue(_owner);
              }else{
                resolve();
              }
            },
            function() {
              _owner.queueList.splice(0, 1)
              if (_owner.queueList[0]) {
                return _iterationQueue(_owner);
              }else{
                resolve();
              }
            })
          }else{
            if (_queue.task.unlink) {
              _owner.queueList.splice(0, 1)
              if (_owner.queueList[0]) {
                return _iterationQueue(_owner);
              }else{
                resolve();
              }
            }
          }
        })
      }else{
        resolve();
      }
}
});
}
