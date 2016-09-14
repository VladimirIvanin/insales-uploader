import _ from 'lodash';

export function instance (owner) {

  const instanceDefault = {}

  instanceDefault.folders = {
      'template': owner.options.theme.root+'/templates/',
      'snippets': owner.options.theme.root+'/snippets/',
      'style': owner.options.theme.root+'/assets/style/',
      'script': owner.options.theme.root+'/assets/js/',
      'img': owner.options.theme.root+'/assets/img/',
      'svg': owner.options.theme.root+'/assets/svg/',
      'snippets': owner.options.theme.root+'/snippets/',
      'media': owner.options.theme.root+'/assets/media/',
      'fonts': owner.options.theme.root+'/assets/fonts/',
      'config': owner.options.theme.root+'/config/',
      'media_root': owner.options.theme.root+'/media/'
    }

    instanceDefault.toWatch = [];
    _.forEach(instanceDefault.folders, function(folder) {
      var _seeFolder = `${folder}*.*`;
      if (owner.options.theme.assets) {
        instanceDefault.toWatch.push(_seeFolder)
      }else{
        if (folder.indexOf('/assets/') < 0) {
          instanceDefault.toWatch.push(_seeFolder)
        }
      }
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
      '.svg.liquid': instanceDefault.folders['svg'],
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
        'backup': `${owner.options.theme.root}/backup/templates/`,
        'folder': instanceDefault.folders['template']
      },
      'Asset::Snippet': {
        'extension': '.liquid',
        'backup': `${owner.options.theme.root}/backup/snippets/`,
        'folder': instanceDefault.folders['snippets']
      },
      'Asset::Configuration': {
        'extension': ['.json', '.html'],
        'backup': `${owner.options.theme.root}/backup/config/`,
        'folder': instanceDefault.folders['config']
      },
      'Asset::Media': {
        'extension': ['.css', '.js', '.coffee', '.jpeg', '.gif', '.png', '.svg', '.scss', '.js.liquid', '.css.liquid', '.scss.liquid'],
        'backup': `${owner.options.theme.root}/backup/media/`,
        'folder': instanceDefault.folders['media']
      }
    }

  return instanceDefault;
}
