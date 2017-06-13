import isBinaryFile from 'isbinaryfile';
import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import stylelint from 'stylelint';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import syntax from 'postcss-scss';
var esLinter = require("eslint").linter;
import { setQueueAsset } from '../request/assetManager';
import { updateteAssets } from '../request/asset';
import { writeFile,
         fileMissing} from '../file-system/file';
import { getAssetPath } from '../paths';
import chokidar from 'chokidar';
import delay from 'delay';
import cpFile from 'cp-file';
const jsdiff = require('diff');
import clc from 'cli-color';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

/**
 * Получаем событие файловой системы и путь к файлу, собираем информацию о файле и отправляем в менеджер задач
 */
export function _watch(conf, state, event, _path, _debugMode) {
  const paths = conf.get('paths');
  const options = conf.get('options');
  const eventEmitter = conf.get('eventEmitter');
  let pathNormal = path.normalize(_path);
  let pathParse = path.parse(pathNormal);
  let _fileName = pathParse.base;
  let debugMode = _debugMode || false;

  if (/\s/g.test(_fileName)) {
    eventEmitter.emit('file:error', {
      message: `Недопустимое имя файла - ${_path}`
    });
    throw new Error('Удалите пробелы в названии файла.');
  }
  if (!_.includes(['add', 'change', 'unlink'], event)) {
    return;
  }


  getFileInfo(_path, paths, event).then(fileInfo => {
    if (debugMode) {
      let _fileInfo = _.cloneDeep(fileInfo);
      console.log(log_notice('\nEvent: ') + `${event}`)
      console.log( log_notice('File info: ') );
      console.log(_.omit(_fileInfo, ['data']));
    }

    let _content = getContent(fileInfo);
    fileInfo.content = _content;
    fileInfo.event = event;


    if (_.eq(fileInfo.type, 'Asset::Media')) {
      // сравнить файлы и скопировать ассет в папку media если нужно
      if (fileInfo.synchronizePath !== '' && options.theme.assetsSync) {
        syncFile(fileInfo.path, fileInfo.synchronizePath, fileInfo.encode, event, debugMode)
      }

      if (fileInfo.isMediaFile) {

        let isStyle = (_.indexOf(['.scss', '.css'], fileInfo.pathParse.ext) > -1);
        let isScripts = (_.indexOf(['.js'], fileInfo.pathParse.ext) > -1);
        let isScriptsLintUse = (_.indexOf(['.js'], fileInfo.pathParse.ext) > -1) && options.tools.esLint.use;
        let isStyleLintUse = (_.indexOf(['.scss', '.css'], fileInfo.pathParse.ext) > -1) && options.tools.stylelint.use;

        if (isStyle) {
          if (/#=/g.test(fileInfo.content.asset.content) || /\/=/g.test(fileInfo.content.asset.content)) {
            isStyleLintUse = false;
          }

          if (isStyleLintUse) {
            stylelint.lint({
              code: fileInfo.content.asset.content,
              config: options.tools.stylelint.config,
              formatter: "string",
              syntax: "scss"
            }).then((data)  => {
              if (data.errored && data.output) {
                eventEmitter.emit('css:error', {
                  message: data.output
                });
                if (!options.tools.stylelint.stopOnFail) {
                  setQueueAsset(conf, state, fileInfo, {},debugMode);
                }
              }else{
                if (options.tools.autoprefixer.use) {

                  postcss([ autoprefixer(options.tools.autoprefixer.config) ]).process(fileInfo.content.asset.content, { syntax: syntax }).then(function (result) {
                    result.warnings().forEach(function (warn) {
                      eventEmitter.emit('css:error', {
                        message: warn.toString()
                      });
                    })
                    fileInfo.content.asset.content = result.css;
                    setQueueAsset(conf, state, fileInfo, {},debugMode);
                  })
                }else{
                  setQueueAsset(conf, state, fileInfo, {},debugMode);
                }
              }
            })

          }else{
            if (options.tools.autoprefixer.use) {
              postcss([ autoprefixer(options.tools.autoprefixer.config) ]).process(fileInfo.content.asset.content, { syntax: syntax }).then(function (result) {
                result.warnings().forEach(function (warn) {
                  eventEmitter.emit('css:error', {
                    message: warn.toString()
                  });
                });
                fileInfo.content.asset.content = result.css;
                setQueueAsset(conf, state, fileInfo, {},debugMode);
              })
            }else{
              setQueueAsset(conf, state, fileInfo, {},debugMode);
            }

          }
        }

        if (isScripts) {
          if (/#=/g.test(fileInfo.content.asset.content)) {
            isScriptsLintUse = false;
          }

          if (isScriptsLintUse) {

            var messages = esLinter.verify(fileInfo.content.asset.content, options.tools.esLint.config, { filename: fileInfo.path });

            if (messages.length > 0) {
              var isError = false;
              _.forEach(messages, function (message) {
                if (message.fatal) {
                  isError = true;
                }
                eventEmitter.emit('js:error', {
                  warn: `${message.message}\n`,
                  message: `${message.source}\n\nСтрока: ${message.line}\nФайл: ${fileInfo.path}`
                });
              });

              if (!isError) {
                setQueueAsset(conf, state, fileInfo, {}, debugMode);
              }else{
                if (!options.tools.esLint.stopOnFail) {
                  setQueueAsset(conf, state, fileInfo, {},debugMode);
                }
              }

            }else{
              setQueueAsset(conf, state, fileInfo, {},debugMode);
            }
          }else{
            setQueueAsset(conf, state, fileInfo, {},debugMode);
          }
        }

        if (!isScripts && !isStyle) {
          setQueueAsset(conf, state, fileInfo, {},debugMode);
        }
    }

    }
    if(! _.eq(fileInfo.type, 'Asset::Media')){
      setQueueAsset(conf, state, fileInfo, {},debugMode);
    }

  });
}

/**
 * Сравнивает два файла, возваращает true если они разные
 */
function syncFile(file1, file2, encode, event, debugMode = false) {

  if (_.isEqual(event, 'unlink')) {
    fileMissing(file2).then(()=>{
      return;
    }).catch(()=>{
      fs.unlink(file2, function(err){
        if (debugMode) {
          console.log(`${file2} удален`)
        }
        if(err) return console.log(err);
      });
      return
    })
  }else{


  fs.readFile(file2,  (err2, data2) => {
    if (err2){
      cpFile.sync(file1, file2);
      if (debugMode) {
        console.log(`${file1} синхронизирован с ${file2}\n`)
      }
      return;
    }else{
      let stats1 = fs.statSync(file1)
      let stats2 = fs.statSync(file2)
      let fileSizeInBytes1 = _.toNumber(stats1["size"]);
      let fileSizeInBytes2 = _.toNumber(stats2["size"]);

      if (_.isEqual(fileSizeInBytes1, fileSizeInBytes2)) {

        fs.readFile(file1,  (err1, data1) => {
          if (err1) {
            console.log(`Невозможно прочитать файл ${file1}`)
            return;
          }else{
            let difa = jsdiff.diffChars(data2.toString(encode), data1.toString(encode));
            let difSize = _.size(difa);
            if (difSize > 1) {
              if (debugMode) {
                console.log(`${file1} синхронизирован с ${file2}\n`);
              }
              cpFile.sync(file1, file2);
            }else{
              if (debugMode) {
                console.log(`Нет причин для синхронизации`)
                console.log(`${file1} идентичен ${file2}\n`);
              }
            }
          }
        });
      }else{
        if (debugMode) {
          console.log(`${file1} синхронизирован с ${file2}\n`)
        }
        cpFile.sync(file1, file2);
      }
    }
  })
}
}

export function triggerFile(conf, state, event, _path) {
  return new Promise(function (resolve, reject) {
    _watch(conf, state, event, _path);
    resolve();
  });
}

export function closeWatcher(conf, state) {
  const options = conf.get('options');
  const eventEmitter = conf.get('eventEmitter');

  eventEmitter.emit('theme:stream:stop', {
    message: `Stop watcher`
  });
}
export function watcher(conf, state) {
  const paths = conf.get('paths');
  const options = conf.get('options');
  const eventEmitter = conf.get('eventEmitter');
  let debugMode = options.tools.debugMode || false;

  var _options = {
    ignored: /[\/\\]\./,
    ignoreInitial: true,
    followSymlinks: true,
    usePolling: true,
    interval: 200,
    binaryInterval: 300,
    alwaysStat: true,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    },
    ignorePermissionErrors: true
  }

  var watchOptions = deepMerge(_options, options.tools.chokidar);

  var watcherInstance = chokidar.watch(paths.toWatch, watchOptions).on('all', (event, _path) => {
    _watch(conf, state, event, _path, debugMode);
  });

  eventEmitter.on('theme:stream:stop', function (data) {
    watcherInstance.close();
  });

}

function deepMerge(object, source) {
  return _.mergeWith(object, source,
    function(objValue, srcValue) {
      if (_.isObject(objValue) && srcValue) {
        return deepMerge(objValue, srcValue);
      }
  });
}


/**
 * @return
 * {
 *   name: 'test.js',
 *   type: 'Asset::Media',
 *   path: 'root/assets/js/test.js',
 *   synchronizePath: '' || 'root/media/test.js',
 *   encode: 'utf8',
 *   isBinary: false,
 *   data: 'console.log("My test file")'
 * }
 */
export function getFileInfo(_path, paths, event = 'add') {
  return new Promise(function (resolve, reject) {
  let fileInfo = {};
  fileInfo.path = path.normalize(_path);
  fileInfo.pathParse = path.parse(_path);
  fileInfo.encode = 'utf8';
  fileInfo.isBinary = false;
  fileInfo.data = '';

  let assetInfo = getAssetInfo(_path, paths)
  fileInfo = _.merge(fileInfo, assetInfo)
  if (event === 'unlink') {
    resolve(fileInfo);
  }else{
    if (isBinaryFile.sync(_path)) {
      fileInfo.encode = 'base64';
      fileInfo.isBinary = true;
    }
    fs.readFile(_path, (err, data) => {
      if (err) throw err;
      var _data = data.toString(fileInfo.encode)
      fileInfo.data = _data
      resolve(fileInfo);
    })
  }
  })
}

/**
 * @return
 * {
 *   name: 'test.js',
 *   type: 'Asset::Media',
 *   isMediaFile: true,
 *   synchronizePath: '' || 'root/media/test.js'
 * }
 */
export function getAssetInfo(_path, paths) {
  let assetInfo = {};
  assetInfo.synchronizePath = '';

  let pathMedia = paths.folders.media_root;
  let pathNormal = path.normalize(_path);
  let pathParse = path.parse(pathNormal);
  let _fileName = pathParse.base;
  let _dirPath = pathParse.dir;
  var _ext = pathParse.ext;
  let _folderParent = _.last(_dirPath.split(path.sep));
  let _assetType = _.findKey(paths.assets, function(o) {
    return _.includes(o.folder, _dirPath);
  })

  if (!_assetType) {
    _assetType = 'Asset::Media';
  }

  assetInfo.name = _fileName;
  assetInfo.type = _assetType;
  assetInfo.isMediaFile = false;;

  if (_assetType === 'Asset::Media') {
    if (pathMedia.indexOf(_dirPath) < 0 ) {
      assetInfo.synchronizePath = path.normalize(pathMedia + '/' + _fileName);
    }else{
      assetInfo.isMediaFile = true;
      assetInfo.synchronizePath = getAssetPath(paths, _assetType, _fileName, _ext, { isAssetsPath: true });
    }
  }

  return assetInfo;
}

/**
 * Получить объект в нужном для insalesApi виде
 * @param  {object} fileInfo информация о файле
 * {
 *   name: 'test.js',
 *   type: 'Asset::Media',
 *   synchronizePath: '' || 'root/media/test.js',
 *   encode: 'utf8',
 *   isBinary: false,
 *   data: 'console.log("My test file")'
 * }
 */
export function getContent(fileInfo, event = 'add') {
  let _content = {}
  if (_.eq(event, 'unlink')) {
    return _content;
  }

  _content.asset = {};
  _content.upload = {
    'name': fileInfo.name,
    'type': fileInfo.type
  }

  if (fileInfo.isBinary) {
    _content.asset['attachment'] = fileInfo.data;
    _content.upload['attachment'] = fileInfo.data;
  }else{
    let dataReplace = remove_etx(fileInfo.data, fileInfo.name);
    _content.asset['content'] = dataReplace
    _content.upload['content'] = dataReplace;
  }

  return _content;
}

function remove_etx(str, name) {

  if ((str===null) || (str===''))
       return '';
 else
   str = str.toString();
   let searchRegExp = /\x03/g;
   if (searchRegExp.test(str)) {
     console.log(log_warn(`Удалите спецсимвол \\u0003 из файла ${name}`));
     str = str.replace(/\x03/g, '');
   }
  return str;
}

export function uploadAssets(conf, state, param) {
  const options = conf.get('options');
  const paths = conf.get('paths');

  if (!param) {
    var param = {
      update: false
    }
  }else{
    if (!param.update) {
      param.update = false
    }
  }
  updateteAssets(conf, state).then(function () {
  const assets = conf.get('assets');
  var _folders = paths.foldersDefaults;
  var _folderSize = _.size(_folders);
  var _count = 0;
  _.forEach(_folders, function (folder) {
    fs.readdir(folder, function(err, list) {
      var _listSize = list.length - 1;
      if (err) {
        console.log(err);
      }
      if (list.length > 0) {
        _.forEach(list, function (_name, index) {
          var _fullPath = path.normalize(folder + _name);
          if ( _.isUndefined(assets[_fullPath]) || param.update ) {

            getFileInfo(_fullPath, paths, 'add').then(fileInfo => {
              let _content = getContent(fileInfo);
              fileInfo.content = _content;
              fileInfo.event = 'add';
              setQueueAsset(conf, state, fileInfo)
              if (index === _listSize) {
                _count++
              }
            })
          }else{
            if (index === _listSize) {
              _count++
            }
          }
        })
      }else{
        _count++
      }
    })
  })
  })
}
