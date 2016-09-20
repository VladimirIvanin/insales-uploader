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
  }
}

// Инициализация
var InsalesUp = new InsalesUploader(option)

// Метод вызывает загрузку темы на компьютер
InsalesUp.download()

// Метод вызывает отслеживание изменений в файлах
InsalesUp.stream()

// Метод вызывает создание архива с резервной копией
InsalesUp.backup()

// Метод для сортировки аасетов из папки media
InsalesUp.initAssets()

```

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
