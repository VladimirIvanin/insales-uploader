import Promise from 'promise';
import path from 'path';
import _ from 'lodash';

export function patchAsset (_owner, paths, options, assets) {
  return new Promise(function (resolve, reject) {

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
      }

      if (_type === 'Asset::Media') {
        asset.isMedia = true;
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


      if (asset['name'].indexOf('/') > -1) {
        console.error('Недопустимое имя файла:', asset['name'])
      }
      _owner.assets[asset.pathKey] = asset;
      _owner.downloadList.push(asset);
    }

    resolve()
    if (assets.length === 0) {
      reject()
    }
  })
}

export function getAssetPath (paths, _type, _name, _ext) {
  var _assets = paths.assets;
  var _mediaExtension = paths.mediaExtension;
  var basePath = _assets[_type]['folder'];
  if (_type === 'Asset::Media') {
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

  return path.normalize(basePath + _name);
}


export function patchOption (_options) {
  const _default = {
    account: {
      http: false,
    },
    theme:{
      update: true,
      startBackup: true,
      assets: true,
      root: 'shop',
      backup: 'zip'
    }
  }
  const options = _.merge(_default, _options);

  if (!options.account.id) throw new Error('Missing app id');
  if (!options.account.token) throw new Error('Missing app token');
  if (!options.account.url) throw new Error('Missing app url');
  options.account.protocol = (options.account.http) ? 'http://' : 'https://';

  const VRegExp = new RegExp(/^http.*:[www]*\/\//);
  const VResult = _options.account.url.replace(VRegExp, '');
  options.account.url = VResult.replace('/', '');
  options.handle = _.split(options.account.url, '.', 1);
  options.pathBackup = path.normalize(options.theme.root + '/backup');

  return options;
}
