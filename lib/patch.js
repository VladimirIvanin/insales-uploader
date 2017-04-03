'use strict';
import _ from 'lodash';
import path from 'path';

export function patchAsset (conf, ownerAssets, assets) {
  return new Promise(function (resolve, reject) {

    const options = conf.get('options');
    const paths = conf.get('paths');
    const downloadList = conf.get('downloadList');
    const eventEmitter = conf.get('eventEmitter');

    for (var i = 0; i < assets.length; i++) {

      var asset = assets[i];
      var _type = asset.type;
      var _name = asset.name;
      var _nameSplit = _name.split('.');
      var _folders = paths.folders;
      var _assets = paths.assets;
      var _mediaExtension = paths.mediaExtension;
      var _isAssets = options.theme.assets;

      asset.isMedia = false;
      asset.pathMedia = '';
      asset.folder = path.normalize( _assets[_type]['folder'] );
      asset.backup = path.normalize( _assets[_type]['backup'] );

      if (_type === 'Asset::Template' || _type === 'Asset::Snippet') {
        var _extension = _assets[_type]['extension'];
        if (_name.indexOf(_extension) === -1) {
          asset['name'] = _name + _extension;
        }
        asset['queue'] = 1;
      }else{
        asset['queue'] = 2;
      }

      if (_type === 'Asset::Media') {
        asset.isMedia = true;
        asset['folder'] = _folders['media'];

        if (asset['content-type'] === 'text/js') {
          asset['folder'] = _mediaExtension['.js']
        }
        if (asset['content-type'] === 'text/css') {
          asset['folder'] = _mediaExtension['.css']
        }
        if (asset['content-type'] === 'application/x-scss') {
          asset['folder'] = _mediaExtension['.scss']
        }
        if (asset['content-type'] === 'application/x-svg') {
          asset['folder'] = _mediaExtension['.svg']
        }
        if (asset['content-type'].indexOf('image') > -1) {
          asset['folder'] = _folders['img'];
        }
        if (asset['content-type'] === 'application/x-ico') {
          asset['folder'] = _folders['img'];
        }
        if (_name.indexOf('.svg') > -1) {
          asset['folder'] = _mediaExtension['.svg'];
        }
        if (_name.indexOf('.scss') > -1) {
          asset['folder'] = _mediaExtension['.scss'];
        }
        if (_name.indexOf('.css') > -1) {
          asset['folder'] = _mediaExtension['.css'];
        }
        if (_name.indexOf('.js') > -1) {
          asset['folder'] = _mediaExtension['.js'];
        }
        if (_name.indexOf('.coffee') > -1) {
          asset['folder'] = _mediaExtension['.coffee'];
        }
        if (_name.indexOf('.js.liquid') > -1) {
          asset['folder'] = _mediaExtension['.js'];
        }
        if (_name.indexOf('.svg.liquid') > -1) {
          asset['folder'] = _mediaExtension['.svg'];
        }
        if (_name.indexOf('.css.liquid') > -1) {
          asset['folder'] = _mediaExtension['.css'];
        }
        if (_name.indexOf('.scss.liquid') > -1) {
          asset['folder'] = _mediaExtension['.css'];
        }
        if (asset['content-type'].indexOf('application') > -1) {
          var _ext = '.' + _nameSplit[_nameSplit.length - 1];
          if (_mediaExtension[_ext]) {
            asset['folder'] = _mediaExtension[_ext]
          }
        }
      }

      asset.path = path.normalize( asset.folder + asset['name'] );
      asset.pathKey = path.normalize( asset.folder + asset['name'] );
      asset.backupPath = asset.backup + asset['name'];


      if (_type === 'Asset::Media') {
        asset.pathMedia = path.normalize( _folders['media_root'] + asset['name'] );
        asset.pathKey = path.normalize( _folders['media_root'] + asset['name'] );
      }

      if (asset['name'].indexOf('/') > -1 || asset['name'].indexOf('@') > -1) {
        eventEmitter.emit('file:error', {
          message: `Недопустимое имя файла: ${asset['name']}`
        });
      }
      ownerAssets[asset.pathKey] = asset;
      downloadList.push(asset);
    }

    conf.set('assets', ownerAssets)
    conf.set('downloadList', downloadList)

    resolve()
    if (assets.length === 0) {
      reject()
    }
  })
}

export function patchOption (_options) {
  const _default = {
    consoleLogger: true,
    account: {
      http: true,
    },
    theme:{
      update: true,
      startBackup: true,
      assets: true,
      excludeFiles: [],
      root: '.',
      backup: 'zip'
    },
    tools:{
      debugMode: false,
      openBrowser: {
        start: false
      },
      stylelint: {
        use: true,
        stopOnFail: true,
        config: {
          "rules": {
            "property-no-unknown": true,
            "unit-no-unknown": true,
            "selector-type-no-unknown": true,
            "color-no-invalid-hex": true
          }
        }
      },
      browserSync:{
        start: false,
        uploadRestart: false
      }
    }
  }


  const options = _.merge(_default, _options);

  if (!options.theme.id) throw new Error('Missing theme id');
  if (!options.account.id) throw new Error('Missing app id');
  if (!options.account.token) throw new Error('Missing app token');
  if (!options.account.url) throw new Error('Missing app url');

  options.account.protocol = (options.account.http) ? 'http://' : 'https://';

  options.theme.root = path.normalize(path.resolve(options.theme.root));

  const VRegExp = new RegExp(/^http.*:[www]*\/\//);
  const VResult = _options.account.url.replace(VRegExp, '');

  options.account.url = VResult.replace('/', '');
  options.handle = `${_.split(options.account.url, '.', 1)}-${options.theme.id}` ;
  options.pathBackup = path.normalize(options.theme.root + '/backup');
  options.themeUrl = options.account.protocol + options.account.url + '/?theme_preview=' + options.theme.id

  options.insalesApi = {
    id: options.account.id,
    secret: options.account.token,
    http: options.account.http
  }

  return options;
}

export function patchThemes (conf, themes) {
    const options = conf.get('options');

    options.theme.list = themes;
    return new Promise((resolve, reject) => {
    _.forEach(themes, (_theme, index) => {
      if (_.toNumber(_theme.id) == options.theme.id) {
        _theme.type = typeTheme(_theme);
        options.theme.current = _theme;
        conf.set('options', options);
        resolve(_theme);
      }
    });
  });
}

function typeTheme(_theme) {
  var _type = 'Альтернативная';
  if (_theme['is-published'] == 'true') {
    _type = 'Основная';
  }
  if (_theme['is-mobile'] == 'true') {
    _type = 'Мобильная';
  }
  return _type;
}
