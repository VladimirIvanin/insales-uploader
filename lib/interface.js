'use strict';
import { getAsset,
         getAssets,
         updateListThemes,
         updateteAssets,
         uploadAsset,
         removeAsset,
         editAsset } from './request/asset';
import { createDir,
          reloadDir,
          zippedDir } from './file-system/dir';
import { _watch,
          watcher,
          triggerFile,
          uploadAssets } from './file-system/watch';
import { initAssets,
         pushTheme,
         pullTheme,
         diffLocalAssets } from './file-system/assets';
import { checkPackageVersion } from './cli/packageVersion';
import { startBrowser,
         startBrowserSync } from './tools/browser';
import _ from 'lodash';


export function downloadTheme (conf, state) {
  const action = {
    method: 'download'
  }

  const options = conf.get('options');
  const paths = conf.get('paths');
  const eventEmitter = conf.get('eventEmitter');

  eventEmitter.emit('theme:download:start', options);

  return new Promise(function (resolve, reject) {
    createDir(options, paths, action).then(() => {
      updateteAssets(conf, state).then(() => {
        getAssets(conf, action).then(function() {

          if (options.theme.startBackup && options.theme.backup === 'zip') {
            eventEmitter.emit('theme:zip:start', {
              message: `start zip`
            });

            zippedDir(paths, options.pathBackup, `${options.handle}-backup`, 'backup').then(function(data){
              eventEmitter.emit('theme:zip:finish', data);

              diffLocalAssets(conf, state).then(function() {
                resolve();
              })
            });
          }else{
            diffLocalAssets(conf, state).then(function() {
              resolve();
            })
          }

        });
      });
    });
  });
}

export function streamTheme (conf, state) {
  const options = conf.get('options');
  const paths = conf.get('paths');
  const assets = conf.get('assets');
  const eventEmitter = conf.get('eventEmitter');

  return new Promise(function (resolve, reject) {
    checkPackageVersion().then(() => {
      updateteAssets(conf, state).then(() => {
        diffLocalAssets(conf, state).then(() => {
          watcher(conf, state);
          updateListThemes(conf, state).then(theme => {

            if (options.tools.browserSync.start) {
              startBrowserSync(options.themeUrl, options, paths)
            }else{
              if (options.tools.openBrowser.start) {
                startBrowser(options.themeUrl, options.tools.openBrowser)
              }
            }

            eventEmitter.emit('theme:stream:start', {
              themeTitle: theme.title,
              themeStatus: theme.type
            });
            resolve();
          });
        })
      });
    });
  });
}

export function backupTheme (conf, state, _settings) {
  const options = conf.get('options');
  const paths = conf.get('paths');
  const assets = conf.get('assets');
  const eventEmitter = conf.get('eventEmitter');

  return new Promise(function (resolve, reject) {
    var action = {
      method: 'backup'
    }
    reloadDir(paths, action).then(() => {
      updateteAssets(conf, state).then(() => {
        getAssets(conf, action).then(() =>  {
          if ( _settings && _settings.zip || options.theme.backup === 'zip') {
            eventEmitter.emit('theme:zip:start', {
              message: `start zip`
            });
            zippedDir(paths, options.pathBackup, `${options.handle}-backup`, 'backup').then((data) => {
              eventEmitter.emit('theme:zip:finish', data);
              resolve();
            });
          }else{
            resolve();
          }
        });
      });
    });
  });
}
