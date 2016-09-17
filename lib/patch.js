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
      var _asset = asset;
      var _folders = paths.folders;
      var _assets = paths.assets;
      var _mediaExtension = paths.mediaExtension;
      var _isAssets = options.theme.assets;

      _asset.folder = path.normalize( _assets[_type]['folder'] );
      _asset.backup = path.normalize( _assets[_type]['backup'] );

      if (_type === 'Asset::Template' || _type === 'Asset::Snippet') {
        var _extension = _assets[_type]['extension'];
        if (_name.indexOf(_extension) === -1) {
          _asset['name'] = _name + _extension;
        }
      }

      if (_type === 'Asset::Media') {
        if (_asset['content-type'] === 'text/js') {
          _asset['folder'] = _mediaExtension['.js']
        }
        if (_asset['content-type'] === 'text/css') {
          _asset['folder'] = _mediaExtension['.css']
        }
        if (_asset['content-type'] === 'application/x-scss') {
          _asset['folder'] = _mediaExtension['.scss']
        }
        if (_asset['content-type'] === 'application/x-svg') {
          _asset['folder'] = _mediaExtension['.svg']
        }
        if (_asset['content-type'].indexOf('image') > -1) {
          _asset['folder'] = _folders['img'];
        }
        if (_asset['content-type'] === 'application/x-ico') {
          _asset['folder'] = _folders['img'];
        }
        if (_name.indexOf('.svg') > -1) {
          _asset['folder'] = _mediaExtension['.svg'];
        }
        if (_name.indexOf('.scss') > -1) {
          _asset['folder'] = _mediaExtension['.scss'];
        }
        if (_name.indexOf('.css') > -1) {
          _asset['folder'] = _mediaExtension['.css'];
        }
        if (_name.indexOf('.js') > -1) {
          _asset['folder'] = _mediaExtension['.js'];
        }
        if (_name.indexOf('.coffee') > -1) {
          _asset['folder'] = _mediaExtension['.coffee'];
        }
        if (_name.indexOf('.js.liquid') > -1) {
          _asset['folder'] = _mediaExtension['.js'];
        }
        if (_name.indexOf('.svg.liquid') > -1) {
          _asset['folder'] = _mediaExtension['.svg'];
        }
        if (_name.indexOf('.css.liquid') > -1) {
          _asset['folder'] = _mediaExtension['.css'];
        }
        if (_name.indexOf('.scss.liquid') > -1) {
          _asset['folder'] = _mediaExtension['.css'];
        }
        if (_asset['content-type'].indexOf('application') > -1) {
          var _ext = '.' + _nameSplit[_nameSplit.length - 1];
          if (_mediaExtension[_ext]) {
            _asset['folder'] = _mediaExtension[_ext]
          }
        }
      }

      if (!_isAssets && _type === 'Asset::Media') {
        _asset.folder = path.normalize( _folders['media_root'] );
      }

      _asset.path = path.normalize( _asset.folder + _asset['name'] );
      _asset.backupPath = _asset.backup + _asset['name'];

      if (_asset['name'].indexOf('/') > -1) {
        console.error('Недопустимое имя файла:', _asset['name'])
      }
      _owner.assets[_asset.path] = _asset;
      _owner.downloadList.push(_asset);
    }

    resolve()
    if (assets.length === 0) {
      reject()
    }
  })
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
