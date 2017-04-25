'use strict';
import moment from 'moment';

export function streamTime () {
  moment.locale('ru')
  var _now = moment();

  process.on('SIGINT', () => {
    var _end = moment();
    var diff = moment(_end).unix() - moment(_now).unix();

    var _workTime = moment.utc(diff * 1000).format('HH:mm:ss')
    console.log(`Время сессии: [${_workTime}]`);
    process.exit(1);
  });
}
