import { getAsset,
         getAssets,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from './asset';
import _ from 'lodash';
import Promise from 'promise';

export function setQueueAsset(_owner, _content, _path, _task) {
    const _item = {};
    _item.path = _path;
    _item.task = _task;
    _item.content = _content;
    _owner.queueList.push(_item);
    queueStart(_owner, _path);
};

function queueStart(_owner, _path) {
  if (!_owner.inWork && _owner.queueList[0]) {
    recursionQueue(_owner).then(function() {
      _owner.inWork = false;
    })
  }
}

function assetSort (_owner, _path) {
  var _taskIndex = _.findLastIndex(_owner.queueList, function(o) { return o.path == _path; });
  if (_taskIndex > -1) {
    for (var i = 0; i < _owner.queueList.length; i++) {
      if (_owner.queueList[i] && _owner.queueList[i].path === _path && i != _taskIndex) {
        _owner.queueList.splice(i, 1);
      }
    }
  }
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
              })
            }else{
              uploadAsset (_owner, _queue.content.upload, _queue.path).then(function() {
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
            removeAsset(_owner, _owner.assets[_queue.path].id, _queue.path, _queue.task.name).then(function() {
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
