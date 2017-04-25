'use strict';
import moment from 'moment';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export function streamTime () {
  moment.locale('ru')
  var _now = moment();

  rl.on('close', (input) => {
    var _end = moment();
    var diff = moment(_end).unix() - moment(_now).unix();

    var _workTime = moment.utc(diff * 1000).format('HH:mm:ss')
    console.log(`Время сессии: [${_workTime}]`);
    process.exit()
  });
}
