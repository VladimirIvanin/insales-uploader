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

import clc from 'cli-color';

const log_edit = clc.xterm(40);
const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_white = clc.xterm(254);
const log_label = clc.xterm(81);
const log_text = clc.xterm(254);
const log_start = clc.xterm(129);

export function downloadTheme (conf, state) {
  const action = {
    method: 'download'
  }

  const options = conf.get('options');
  const paths = conf.get('paths');

  return new Promise(function (resolve, reject) {
    createDir(options, paths, action).then(() => {
      updateteAssets(conf, state).then(() => {
        getAssets(conf, action).then(function() {

          if (options.theme.startBackup && options.theme.backup === 'zip') {
            zippedDir(paths, options.pathBackup, `${options.handle}-backup`, 'backup').then(function(){
              console.info(log_start(options.themeUrl));
              diffLocalAssets(conf, state).then(function() {
                resolve();
              })
            });
          }else{
            console.info(log_start(options.themeUrl));
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

  return new Promise(function (resolve, reject) {
    checkPackageVersion().then(() => {
      updateteAssets(conf, state).then(() => {
        diffLocalAssets(conf, state).then(() => {
          watcher(conf, state);
          updateListThemes(conf, state).then(theme => {
            if (theme.title) {
              console.log(log_label('Тема: ') + log_text(theme.title));
            }
            console.log(log_label('Статус темы: ') + log_text(theme.type));
            if (options.tools.browserSync.start) {
              startBrowserSync(options.themeUrl, options, paths)
            }else{
              if (options.tools.openBrowser.start) {
                startBrowser(options.themeUrl, options.tools.openBrowser)
              }
            }
            console.info(log_start('Start watch'));
            resolve();
          });
        })
      });
    });
  });
}

export function backupTheme (conf, state, _settings) {
  console.log(conf);
  const options = conf.get('options');
  const paths = conf.get('paths');
  const assets = conf.get('assets');

  return new Promise(function (resolve, reject) {
    var action = {
      method: 'backup'
    }
    reloadDir(paths, action).then(() => {
      updateteAssets(conf, state).then(() => {
        getAssets(conf, action).then(() =>  {
          if ( _settings && _settings.zip || self.options.theme.backup === 'zip') {
            zippedDir(paths, self.options.pathBackup, `${self.options.handle}-backup`, 'backup').then(() => {
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
