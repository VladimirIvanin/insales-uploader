import _ from 'lodash';

export function instance (owner) {

  var _today = new Date;
  var _date = `${_today.getFullYear()}-${_today.getMonth()}-${_today.getDate()}-${_today.getHours()}-${_today.getMinutes()}`

  if (!owner.options.root) owner.options.root = 'shop';
  const instanceDefault = {}

  instanceDefault.folders = {
      'template': owner.options.root+'/template/',
      'snippets': owner.options.root+'/snippets/',
      'style': owner.options.root+'/assets/style/',
      'script': owner.options.root+'/assets/js/',
      'img': owner.options.root+'/assets/img/',
      'svg': owner.options.root+'/assets/svg/',
      'snippets': owner.options.root+'/snippets/',
      'media': owner.options.root+'/assets/media/',
      'fonts': owner.options.root+'/assets/fonts/',
      'config': owner.options.root+'/config/'
    }

    instanceDefault.toWatch = [];
    _.forEach(instanceDefault.folders, function(folder) {
      var _seeFolder = `${folder}*.*`;
      instanceDefault.toWatch.push(_seeFolder)
    });

    instanceDefault.mediaExtension = {
      '.css': instanceDefault.folders['style'],
      '.scss': instanceDefault.folders['style'],
      '.css.liquid': instanceDefault.folders['style'],
      '.scss.liquid': instanceDefault.folders['style'],
      '.coffee': instanceDefault.folders['script'],
      '.js': instanceDefault.folders['script'],
      '.js.liquid': instanceDefault.folders['script'],
      '.svg': instanceDefault.folders['svg'],
      '.jpeg': instanceDefault.folders['img'],
      '.jpg': instanceDefault.folders['img'],
      '.gif': instanceDefault.folders['img'],
      '.png': instanceDefault.folders['img'],
      '.ttf': instanceDefault.folders['fonts'],
      '.woff': instanceDefault.folders['fonts'],
      '.woff2': instanceDefault.folders['fonts'],
      '.otf': instanceDefault.folders['fonts'],
      '.eot': instanceDefault.folders['fonts']
    }

    instanceDefault.assets = {
      'Asset::Template': {
        'extension': '.liquid',
        'backup': `${owner.options.root}/backup/${_date}/templates/`,
        'folder': instanceDefault.folders['template']
      },
      'Asset::Snippet': {
        'extension': '.liquid',
        'backup': `${owner.options.root}/backup/${_date}/snippets/`,
        'folder': instanceDefault.folders['snippets']
      },
      'Asset::Configuration': {
        'extension': ['.json', '.html'],
        'backup': `${owner.options.root}/backup/${_date}/config/`,
        'folder': instanceDefault.folders['config']
      },
      'Asset::Media': {
        'extension': ['.css', '.js', '.coffee', '.jpeg', '.gif', '.png', '.svg', '.scss', '.js.liquid', '.css.liquid', '.scss.liquid'],
        'backup': `${owner.options.root}/backup/${_date}/media/`,
        'folder': instanceDefault.folders['media']
      }
    }

  return instanceDefault;
}
