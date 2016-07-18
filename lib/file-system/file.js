import fs from 'fs';
import Promise from 'promise';
import http from 'http';

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

export function writeFile(_path, _contents, _encodes) {
  return new Promise(function (resolve, reject) {
  fs.open(_path, "w+", function(err, file_handle) {
      if (!err) {
          fs.write(file_handle, _contents, null, _encodes, function(err, written) {
              if (!err) {
                  console.info('download: ' + _path);
                  resolve();
                  fs.close(file_handle);
              } else {
                  console.info(err);
              }
          });
      } else {
        console.info(err);
        reject()
      }
    });
  });
}

export function writeFileWithDownload(url, dest, cb) {
    return new Promise(function (resolve, reject) {
      var file = fs.createWriteStream(dest);
      var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          console.info('download: ' + dest);
          resolve()
          file.close(cb);
        });
      }).on('error', function(err) {
        fs.unlink(dest);
        if (cb) cb(err.msg);
        reject()
      });
    });
};

export function writeManager (_asset, _uri, dataReponse, action, _owner, callback) {
  var _contents = dataReponse.content

  if (dataReponse.asset_url) {
    if (action.method === 'download' && action.rewrite) {
      writeFileWithDownload(_uri, _asset.path).then(function () {
        callback()
      })
    }
    if (_owner.options.startBackup || action.method === 'backup') {
      writeFileWithDownload(_uri, _asset.backupPath).then(function () {
        callback()
      })
    }
  }else{
    if (action.method === 'download' && action.rewrite) {
      writeFile(_asset.path, _contents, 'utf8').then(function () {
        callback()
      })
    }
    if (_owner.options.startBackup || action.method === 'backup') {
      writeFile(_asset.backupPath, _contents, 'utf8').then(function () {
        callback()
      })
    }
  }
}
