import { getAsset,
         getAssets,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from './asset';
import _ from 'lodash';
import fs from 'fs';
import Promise from 'promise';
import ProgressBar from 'progress';
import delay from 'delay';
import TaskManager from '../taskManager';

var queueManager = new TaskManager({delay: 50});

queueManager.createTask('watch', function (param) {
  let fileInfo = param.fileInfo;
  let conf = param.conf;
  let state = param.state;
  let task = param.task || {};

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
})

export function setQueueAsset(conf, state, fileInfo, _task) {
  let task = _task || {};
  let assets = conf.get('assets');
  let param = {
    conf,
    state,
    fileInfo,
    task
  }

  queueManager.addTask('watch', param, {
    fileInfo: {
      path: fileInfo.path
    }
  })
}
