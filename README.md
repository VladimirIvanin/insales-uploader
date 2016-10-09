# InSales uploader
Менеджер ассетов для платформы [InSales](http://www.insales.ru/).

[![npm version](https://badge.fury.io/js/insales-uploader.svg)](https://badge.fury.io/js/insales-uploader)
[![Dependency Status](https://gemnasium.com/badges/github.com/brainmurder/insales-uploader.svg)](https://gemnasium.com/github.com/brainmurder/insales-uploader)

## Установка

```
npm install insales-uploader --save-dev
```

## Пример

```javascript
// Подключение
var InsalesUploader = require('insales-uploader');

// Настройки
var option = {
  account: {
    id: '0123456798',
    token: '0123456798',
    url: 'shop-41324.myinsales.ru',
    http: false
  },
  theme: {
    id: '123456',
    root: 'my-shop',
    update: true,
    startBackup: true
  },
  tools:{
    openBrowser: {
      start: true,
      app: 'firefox'
    },
    browserSync: {
      start: true,
      uploadRestart: false,
      browser: 'firefox'
    }
  }
}

// Инициализация
var InsalesUp = new InsalesUploader(option)

// Метод вызывает загрузку темы на компьютер
InsalesUp.download()

```

##Методы

`download` — загрузка темы на компьютер

`stream` — отслеживание изменений в файлах

`backup` — создание архива с резервной копией

`initAssets` — сортировка ассетов из папки media

`diffLocalAssets` — Метод сравнивает список файлов на сервере со списком в локальной копии

`openBrowser` — открыть сайт в браузере

> Внимание! Методы *download* и *stream* не следует запускать одновременно!


---

##Настройки
#### account
* id, token — необходимо сгенерировать в бэк-офисе: Приложения -> Разработчикам -> Создать новый ключ доступа;
* url — url магазина из бэк-офиса, ссылка не должна содержать 'http://' и '/';
* http — если в админ панели нет поддержки https, следует выставить значение - true;

#### theme
* id — id темы;
* root — корнеевая папка для сохранения темы;
* update — при значении 'true' локальные файлы будут перезаписываться при повторной загрузке;
* startBackup — при значении 'true' во время загрузки темы через метод **download** в папке 'backup' будут сохранятся резервные копии темы.

#### tools
* browserSync — синхронизация браузера и изменений в файлах. Синхронизация включается при запуске метода `stream`. Поумолчанию перезагрузка браузера отключена для загружаемых файлов, перезагрузка срабатывает на изменение и удаление. Так же можно указать доп. параметры согласно api [browsersync](https://www.browsersync.io/docs/options). `Возможны ошибки из-за неверного указанного протокола http/https, если у вас на сайте нет https то в настройки insales-uploader стоит указать account.http: true`
* openBrowser — открытие браузера при запуске метода `stream`. Чтобы включить данную опцию, в объект свойства нужно добавить `start: true`. Будет открыт браузер поумолчанию. Для старта сайта в определенном браузере, нужно добавить свойство `app`. Свойство `app` специфично работает в разных операционных системах, например чтобы открыть `Chrome`, пользователям MacOs нужно указать `google chrome`, пользователям Linux `google-chrome`, пользователям Windows `chrome`.

> [Пример использования **insales-uploader** с Gulp.js](https://github.com/brainmurder/InSales-uploader-gulp-test)

### Структура папок

```
root/
    |-- assets/
        |-- fonts/
        |-- img/
        |-- js/
        |-- media/
        |-- style/
        |-- svg/
    |-- config/
    |-- media/
    |-- snippets/
    |-- templates/
    |-- backup/
```

![InSales](https://cdn.rawgit.com/brainmurder/insales-uploader/master/insales.png)
