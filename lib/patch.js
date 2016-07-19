import Promise from 'promise';

export function patchAsset (_owner, assets) {
  return new Promise(function (resolve, reject) {

  for (var i = 0; i < assets.length; i++) {

  var asset = assets[i]
  var _type = asset.type;
  var _name = asset.name;
  var _nameSplit = _name.split('.');
  var _asset = asset;
  var instance = _owner.instance;
  var _instanceAssets = _owner.instance.assets;
  var _mediaExtension = _owner.instance.mediaExtension;

  _asset.folder = _instanceAssets[_type]['folder'];
  _asset.backup = _instanceAssets[_type]['backup'];

  if (_type === 'Asset::Template' || _type === 'Asset::Snippet') {
    var _extension = _instanceAssets[_type]['extension'];
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
      _asset['folder'] = instance.folders['img'];
    }
    if (_asset['content-type'] === 'application/x-ico') {
      _asset['folder'] = instance.folders['img'];
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


    _asset.path = _asset.folder + _asset['name'];
    _asset.backupPath = _asset.backup + _asset['name'];

    if (_asset['name'].indexOf('/') > -1) {
      console.error('Недопустимое имя файла:', _asset['name'])
    }
    _owner.assets[_asset.name] = _asset;
    _owner.downloadList.push(_asset);
  }

    resolve()
    if (assets.length === 0) {
      reject()
    }
  })
}
