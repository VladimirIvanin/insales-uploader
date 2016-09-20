import _ from 'lodash';

export function getPaths (options) {
  const pathsDefault = {}

  pathsDefault.foldersDefaults = {
    'template': options.theme.root+'/templates/',
    'snippets': options.theme.root+'/snippets/',
    'config': options.theme.root+'/config/',
    'media_root': options.theme.root+'/media/'
  }

  pathsDefault.folders = {
      'style': options.theme.root+'/assets/style/',
      'script': options.theme.root+'/assets/js/',
      'img': options.theme.root+'/assets/img/',
      'svg': options.theme.root+'/assets/svg/',
      'media': options.theme.root+'/assets/media/',
      'fonts': options.theme.root+'/assets/fonts/'
    }

    _.merge(pathsDefault.folders, pathsDefault.foldersDefaults);

    pathsDefault.toWatch = [];
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
        'backup': `${options.theme.root}/backup/templates/`,
        'folder': pathsDefault.folders['template']
      },
      'Asset::Snippet': {
        'extension': '.liquid',
        'backup': `${options.theme.root}/backup/snippets/`,
        'folder': pathsDefault.folders['snippets']
      },
      'Asset::Configuration': {
        'extension': ['.json', '.html'],
        'backup': `${options.theme.root}/backup/config/`,
        'folder': pathsDefault.folders['config']
      },
      'Asset::Media': {
        'extension': ['.css', '.js', '.coffee', '.jpeg', '.gif', '.png', '.svg', '.scss', '.js.liquid', '.css.liquid', '.scss.liquid'],
        'backup': `${options.theme.root}/backup/media/`,
        'folder': pathsDefault.folders['media']
      }
    }

  return pathsDefault;
}
