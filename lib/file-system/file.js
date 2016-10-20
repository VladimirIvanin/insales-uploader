import fs from 'fs';
import Promise from 'promise';
import http from 'http';
import clc from 'cli-color';
import isBinaryFile from 'isbinaryfile';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

export function fileMissing(_path) {
  return new Promise(function (resolve, reject) {
    fs.stat(_path, (err, stats) => {
      if (err) {
        resolve();
      }else{
        reject();
      }
    });
  });
}

export function writeFile(dest, _contents, _encodes, task) {
  return new Promise(function (resolve, reject) {
  var options = { encoding: _encodes };
  var file = fs.createWriteStream(dest, options);

  file.write(_contents);
  file.end();

  file.on('finish', function () {
    // download
    if (task && task.message) {
      console.log(log_white(task.message));
    }
    resolve();
  }).on('error', function(err) {
      fs.unlink(dest);
      console.log(log_error(err));
      reject()
    });
  });
}

export function writeFileWithDownload(url, dest) {
    return new Promise(function (resolve, reject) {
      var file = fs.createWriteStream(dest);
      var request = http.get(url, function(response) {
        let statusCode = response.statusCode
        if (statusCode !== 404) {
          response.on('data', function(chunk) {
            file.write(chunk);
          }).on('end', function() {
              resolve();
          })
        }
        if (statusCode === 404) {
          console.log(log_error(`Файл по адресу: ${url}, не найден.`));
          resolve()
        }
      }).on('error', function(err) {
        fs.unlink(dest);
        console.log(url, err.msg)
        reject()
      });
    });
};

export function writeManager (_asset, _uri, dataReponse, action, _owner) {
  return new Promise(function (resolve, reject) {
  var _contents = dataReponse.content

  if (dataReponse.asset_url) {
    if (action.method === 'download' && action.rewrite) {
      writeFileWithDownload(_uri, _asset.path).then(function () {
        if (_asset.isMedia) {
          fs.readFile(_asset.path,  (_err, newData) => {
            if (_err){
              writeFileWithDownload(_uri, _asset.pathMedia).then(function () {
                resolve()
              });
            }else{
              if (!isBinaryFile.sync(_asset.path)) {
                var _encode = 'utf8';
              }else{
                var _encode = 'base64';
              }
              writeFile(_asset.pathMedia, newData, _encode).then(function () {
                resolve()
              });
            }
          })
        }else{
          resolve()
        }
      })
    }
    if (_owner.options.theme.startBackup || action.method === 'backup') {
        writeFileWithDownload(_uri, _asset.backupPath).then(function () {
          resolve()
        })
      }
  }else{
    if (action.method === 'download' && action.rewrite) {
      writeFile(_asset.path, _contents, 'utf8').then(function () {
        if (_asset.isMedia) {
          writeFile(_asset.pathMedia, _contents, 'utf8').then(function () {
            resolve()
          })
        }else{
          resolve()
        }
      })
    }
    if (_owner.options.theme.startBackup || action.method === 'backup') {
        writeFile(_asset.backupPath, _contents, 'utf8').then(function () {
          resolve()
        })
      }
  }
  })
}
