# InSales uploader
Менеджер ассетов для платформы [InSales](http://www.insales.ru/).

## Установка

```
npm install insales-uploader --save
```

## Пример

```javascript
// Подключение
var InsalesUploader = require('insales-uploader');

// Настройки
var option = {
  id: '0123456798',
  token: '0123456798',
  url: 'shop-41324.myinsales.ru',
  theme: '123456',
  http: false,
  root: 'my-shop',
  update: true,
  backup: false
}

// Инициализация
var InsalesUp = new InsalesUploader(option)

// Метод вызывает загрузку темы на компьютер
InsalesUp.download()

// Метод вызывает отслеживание изменений в файлах
InsalesUp.stream()

// Метод вызывает загрузку темы в папку backup
InsalesUp.backup()

```

> Внимание! Методы *download* и *stream* не следует запускать одновременно!

---

##Настройки
* id, token — необходимо сгенерировать в бэк-офисе: Приложения -> Разработчикам -> Создать новый ключ доступа;
* url — url магазина из бэк-офиса, ссылка не должна содержать 'http://' и '/';
* theme — id темы;
* http — если в админ панели нет поддержки https, следует выставить значение - true;
* root — корнеевая папка для сохранения темы;
* update — при значении 'true' локальные файлы будут перезаписываться при повторной загрузке;
* backup — при значении 'true' в папке 'backup' будут сохранятся резервные копии темы.

> [Пример использования **insales-uploader** с Gulp.js](https://github.com/brainmurder/InSales-uploader-gulp-test)

![InSales](https://cdn.rawgit.com/brainmurder/insales-uploader/master/insales.png)
