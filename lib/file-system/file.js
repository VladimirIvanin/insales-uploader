import fs from 'fs';
import Promise from 'promise';
import clc from 'cli-color';
import isBinaryFile from 'isbinaryfile';
import download from 'download';
import _ from 'lodash';
import delay from 'delay';
import TaskManager from '../taskManager';
const writeTasks = new TaskManager({delay: 0});

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
 * Задача на запись файлов без скачивания
 */
writeTasks.createTask('writeFile', param => {
  let dest = param.dest;
  let _contents = param._contents;
  let _encodes = param._encodes;
  let task = param.task;

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
      resolve()
    });
  });
});
/**
 * Записать файл
 */
export function writeFile(dest, _contents, _encodes, task = {}) {
  return new Promise(function(resolve, reject) {
    if (!_.isArray(dest)) {
      dest = [dest]
    };

    let _param = {
      _contents,
      _encodes,
      task
    }

    let listTask = _.reduce(dest, function(result, value, key) {
      let param = _.cloneDeep( _param );
      param.dest = value;
      let _result = {
        task: 'writeFile',
        param: param
      }
      result.push(_result)
      return result;
    }, []);

    writeTasks.addTaskList(listTask).then((e) => {
      resolve();
    }, (e) => {
      resolve();
    });
  });
}

/**
 * Записать файл
 */
export function writeFileList(listTask) {
  return new Promise(function(resolve, reject) {
    writeTasks.addTaskList(listTask).then((e) => {
      resolve();
    }, (e) => {
      resolve();
    });
  });
}

/**
 * Скачать и записать файл
 */
export function writeFileWithDownload(url, dest) {
  return new Promise(function (resolve, reject) {
    if (!_.isArray(dest)) {
      dest = [dest]
    };

    let param = {
      timeout: 30000
    };

    download(url, param).then(data => {
      _.forEach(dest, (_dest, key) => {
        fs.writeFileSync(_dest, data);
      })
      resolve();
    }, err => {
      console.log(url, err)
      resolve()
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
      let dest = [_asset.path];
      if (_asset.isMedia) {
        dest.push(_asset.pathMedia)
      }
      if (startBackup) {
        dest.push(_asset.backupPath)
      }

      writeFileWithDownload(_uri, dest).then(function () {
        resolve();
      });
    }else{
      resolve();
    }

    if (action.method === 'backup') {
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
      let pathsList = [_asset.path];

      if (_asset.isMedia) {
        pathsList.push(_asset.pathMedia);
      }
      if (startBackup) {
        pathsList.push(_asset.backupPath);
      }

      writeFile(pathsList, _contents, 'utf8').then(function () {
        resolve();
      });
    }else{
      resolve();
    }

    if (action.method === 'backup') {
      writeFile(_asset.backupPath, _contents, 'utf8').then(function () {
        resolve()
      })
    }
  });
}
