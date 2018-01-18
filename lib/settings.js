export default {
  consoleLogger: true,
  account: {
    http: true,
  },
  theme:{
    update: true,
    startBackup: true,
    assets: true,
    assetsSync: true,
    excludeFiles: [],
    root: '.',
    backup: 'zip',
    assetsDomain: 'https://assets.insales.ru'
  },
  tools:{
    debugMode: false,
    openBrowser: {
      start: false
    },
    autoprefixer: {
      use: true,
      config: {
        browsers: ['last 40 versions'],
        cascade: true
      }
    },
    postCssPlugins: [],
    esLint: {
      use: true,
      stopOnFail: true,
      config: {
        "parserOptions": {
          "ecmaVersion": 6
        }
      }
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
