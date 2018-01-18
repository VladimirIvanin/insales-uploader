'use strict';
import latestVersion from 'latest-version';
import _ from 'lodash';
import clc from 'cli-color';
import compareVersions from 'compare-versions';
const pkg = require('../../package.json');

const log_edit = clc.xterm(40);
const log_notice = clc.xterm(33);
/**
 * Проверка версии
 */
export function checkPackageVersion () {
  return new Promise((resolve, reject) => {
    if (pkg && pkg.name !== 'insales-uploader') {
      resolve();
      return;
    }

    latestVersion('insales-uploader').then(version => {
      let pkgDiff = compareVersions(version, pkg.version);
      if (pkgDiff <= 0) {
        resolve();
      }else{
        console.log( log_edit('Внимание! Доступна новая версия insales-uploader ') + `=> ${version}`);
        console.log( log_notice('Список изменений доступен по ссылке: ') + 'https://github.com/VladimirIvanin/insales-uploader/blob/master/CHANGELOG.md' );
        resolve();
      }
    }).catch(() => {
      resolve();
    });
  });
};
