'use strict';
import _ from 'lodash';
import path from 'path';

export function getPaths (options) {
  const pathsDefault = {};
  pathsDefault.folders = {};
  pathsDefault.root = options.theme.root;

  pathsDefault.foldersDefaults = {
    'template': options.theme.root+'/templates/',
    'snippets': options.theme.root+'/snippets/',
    'config': options.theme.root+'/config/',
    'media_root': options.theme.root+'/media/'
  }

  pathsDefault.foldersAssets = {
      'style': options.theme.root+'/assets/style/',
      'script': options.theme.root+'/assets/js/',
      'img': options.theme.root+'/assets/img/',
      'svg': options.theme.root+'/assets/svg/',
      'media': options.theme.root+'/assets/media/',
      'fonts': options.theme.root+'/assets/fonts/'
    }

    normalizePaths(pathsDefault.foldersDefaults);
    normalizePaths(pathsDefault.foldersAssets);

    pathsDefault.folders = _.merge(pathsDefault.foldersAssets, pathsDefault.foldersDefaults);

    normalizePaths(pathsDefault.folders);

    pathsDefault.toWatch = getExcludeFiles(options);

    _.forEach(pathsDefault.folders, function(folder) {
      var _seeFolder = `${folder}*.*`;
      pathsDefault.toWatch.push(_seeFolder)
    });

    pathsDefault.mediaExtension = {
      '.css': pathsDefault.folders['style'],
      '.scss': pathsDefault.folders['style'],
      '.css.liquid': pathsDefault.folders['style'],
      '.scss.liquid': pathsDefault.folders['style'],
      '.coffee': pathsDefault.folders['script'],
      '.js': pathsDefault.folders['script'],
      '.js.liquid': pathsDefault.folders['script'],
      '.svg': pathsDefault.folders['svg'],
      '.svg.liquid': pathsDefault.folders['svg'],
      '.jpeg': pathsDefault.folders['img'],
      '.jpg': pathsDefault.folders['img'],
      '.gif': pathsDefault.folders['img'],
      '.ico': pathsDefault.folders['img'],
      '.png': pathsDefault.folders['img'],
      '.ttf': pathsDefault.folders['fonts'],
      '.woff': pathsDefault.folders['fonts'],
      '.woff2': pathsDefault.folders['fonts'],
      '.otf': pathsDefault.folders['fonts'],
      '.eot': pathsDefault.folders['fonts']
    }

    pathsDefault.assets = {
      'Asset::Template': {
        'extension': '.liquid',
        'backup': path.normalize(`${options.theme.root}/backup/templates/`),
        'folder': pathsDefault.folders['template']
      },
      'Asset::Snippet': {
        'extension': '.liquid',
        'backup': path.normalize(`${options.theme.root}/backup/snippets/`),
        'folder': pathsDefault.folders['snippets']
      },
      'Asset::Configuration': {
        'extension': ['.json', '.html'],
        'backup': path.normalize(`${options.theme.root}/backup/config/`),
        'folder': pathsDefault.folders['config']
      },
      'Asset::Media': {
        'extension': ['.css', '.js', '.coffee', '.jpeg', '.gif', '.png', '.svg', '.scss', '.js.liquid', '.css.liquid', '.scss.liquid'],
        'backup': path.normalize(`${options.theme.root}/backup/media/`),
        'folder': pathsDefault.folders['media_root']
      }
    }

  return pathsDefault;
}

export function getAssetPath (paths, _type, _name, _ext, _task) {
  var task = _task || {};
  var _assets = paths.assets;
  var _folders = paths.folders;
  var _mediaExtension = paths.mediaExtension;
  var basePath = _assets[_type]['folder'];
  if (task.isAssetsPath) {
    if (_type === 'Asset::Media') {
      basePath = _folders['media'];
      if (_mediaExtension[_ext]) {
        basePath = _mediaExtension[_ext];
      }
      if (_name.indexOf('.svg') > -1) {
        basePath = _mediaExtension['.svg'];
      }
      if (_name.indexOf('.scss') > -1) {
        basePath = _mediaExtension['.scss'];
      }
      if (_name.indexOf('.css') > -1) {
        basePath = _mediaExtension['.css'];
      }
      if (_name.indexOf('.js') > -1) {
        basePath = _mediaExtension['.js'];
      }
      if (_name.indexOf('.coffee') > -1) {
        basePath = _mediaExtension['.coffee'];
      }
      if (_name.indexOf('.js.liquid') > -1) {
        basePath = _mediaExtension['.js'];
      }
      if (_name.indexOf('.svg.liquid') > -1) {
        basePath = _mediaExtension['.svg'];
      }
      if (_name.indexOf('.css.liquid') > -1) {
        basePath = _mediaExtension['.css'];
      }
      if (_name.indexOf('.scss.liquid') > -1) {
        basePath = _mediaExtension['.css'];
      }
    }
  }

  return path.normalize(basePath + _name);
}


/**
 * Нормализация путей
 */
function normalizePaths(paths) {
  _.forEach(paths, (folder, index) => {
    paths[index] = path.normalize(folder)
  });
}

function getExcludeFiles(options) {
  const DEFAULTEXCLUDEFILES = [
    '**/*.DS_Store',
    '**/*.log',
    '**/*.temp'
  ];
  var resultExclude = [];
  var isExclude = [];
  var _userExclude = options.theme.excludeFiles;
  if (_.isString(_userExclude)) {
    _userExclude = [options.theme.excludeFiles];
  }

  resultExclude = _.concat(DEFAULTEXCLUDEFILES, _userExclude);

  isExclude = _.reduce(resultExclude, function (result, value, key) {
    result.push(`!${options.theme.root}/${value}`)
    return result;
  }, [])

  normalizePaths(isExclude)

  return isExclude;
}
