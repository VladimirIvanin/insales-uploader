'use strict';
import fs from 'fs';
import Promise from 'promise';
import clc from 'cli-color';
import isBinaryFile from 'isbinaryfile';
import download from 'download';
import delay from 'delay';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

/**
 * Проверка на отсутствие файла
 */
export function fileMissing(_path) {
  return new Promise((resolve, reject) => {
    fs.stat(_path, (err, stats) => {
      if (err) {
        resolve();
      }else{
        reject();
      }
    });
  });
}

/**
 * Получить кодировку файла
 */
export function getEncode(_path) {
  let _encode = 'utf8';
  if (isBinaryFile.sync(_path)) {
    _encode = 'base64';
  }
  return _encode;
}

/**
 * Записать файл
 */
export function writeFile(dest, _contents, _encodes, task) {
  return new Promise((resolve, reject) => {
  let options = { encoding: _encodes };
  let file = fs.createWriteStream(dest, options);

  file.write(_contents);
  file.end();

  file.on('finish', () => {
    // download
    if (task && task.message) {
      console.log(log_white(task.message));
    }
    resolve();
  }).on('error', err => {
      file.end();
      fs.unlink(dest);
      console.log(log_error(err));
      reject()
    });
  });
}

/**
 * Скачать и записать файл
 */
export function writeFileWithDownload(url, dest) {
  return new Promise(function (resolve, reject) {

    let param = {
      timeout: 30000
    };

    download(url, param).then(data => {
      fs.writeFileSync(dest, data);
      resolve();
    }, err => {
      console.log(url, err)
      reject()
    });

  });
};

/**
 * Распределение задач
 * @param {string} action.method метод вызвавший writeManager
 * @param {boolean} action.rewrite перезаписывать файлы?
 * @param {boolean} startBackup backup при старте?
 * @param {object} _asset объект с информацией об ассете
 * @param {string} _uri ссылка на ассет (абсолютная ссылка)
 * @param {string} dataReponse.asset_url ссылка на ассет (относительная ссылка)
 * @param {string} dataReponse.content контент ассета (неактуален если есть относительная ссылка)
 */

export function writeManager(_asset, _uri, dataReponse, action, startBackup) {
  return new Promise((resolve, reject) => {

    if (dataReponse.asset_url) {
      delay(100)
        .then(() => {
          writeWithDownload(_asset, _uri, dataReponse, action, startBackup).then(() => {
            resolve();
          });
        });
    }else{
      writeFileDownload(_asset, _uri, dataReponse, action, startBackup).then(() => {
        resolve();
      })
    }

  })
}

/**
 * Скачать и записать файл в зависимости от настроек
 */
function writeWithDownload(_asset, _uri, dataReponse, action, startBackup) {
  return new Promise((resolve, reject) => {
    if (action.method === 'download' && action.rewrite) {
      writeFileWithDownload(_uri, _asset.path).then(function () {
        if (!_asset.isMedia) {
          resolve();
          return;
        }
        fileMissing(_asset.path).then(() =>{
          writeFileWithDownload(_uri, _asset.pathMedia).then(function () {
            resolve()
          });
        }, () => {
          fs.readFile(_asset.path,  (_err, newData) => {
            if (_err){
              writeFileWithDownload(_uri, _asset.pathMedia).then(function () {
                resolve()
              });
            }else{
              let _encode = getEncode(_asset.path);
              writeFile(_asset.pathMedia, newData, _encode).then(function () {
                resolve()
              });
            }
          });
        })
      })
    }
    if (startBackup || action.method === 'backup') {
      writeFileWithDownload(_uri, _asset.backupPath).then(function () {
        resolve()
      })
    }
  });
}

/**
 * Записать файл без скачивания, используя контент из dataReponse.content
 */
function writeFileDownload(_asset, _uri, dataReponse, action, startBackup) {
  return new Promise((resolve, reject) => {
    let _contents = dataReponse.content;
    if (action.method === 'download' && action.rewrite) {
      writeFile(_asset.path, _contents, 'utf8').then(function () {
        if (!_asset.isMedia) {
          resolve();
          return;
        }
        writeFile(_asset.pathMedia, _contents, 'utf8').then(function () {
          resolve();
        });
      });
    }
    if (startBackup || action.method === 'backup') {
      writeFile(_asset.backupPath, _contents, 'utf8').then(function () {
        resolve()
      })
    }
  });
}
