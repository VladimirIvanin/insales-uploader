'use strict';
import _ from 'lodash';
import delay from 'delay';
import ProgressBar from 'progress';
import clc from 'cli-color';

const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_edit = clc.xterm(40);
const log_white = clc.xterm(254);

class TaskManager {
  constructor(options){
    this.options = this.patchOption(options);

    this.tasks = {};
    this.taskList = [];
    this.lock = false;
  }

  patchOption(option){
    let newOption = option || {};
    let optionDefault = {
      delay: 100
    }

    return _.merge(optionDefault, newOption)
  }

  createTask(name, task){
    const self = this;
    self.tasks[name] = task;
  }

  /**
   * [
     {
       task: 'watch',
       param: {
         name: 'test'
       }
     },
     {
       task: 'watch',
       param: {
         name: 'test'
       }
     }
    ]
   */
  addTaskList(listTask){
    const self = this;
    return new Promise((resolve, reject) => {
    if (!self.lock) {
      self.taskList = listTask;
      self.taskSequencer().then(() => {
        resolve();
      });
    }else{
      delay(500).then(()=>{
        self.addTaskList(listTask);
      })
    }
    });
  }

  addTask(name, param, filter){
    var self = this;
    if (filter) {
      // адская сотона сравнивает вложенные объекты
      // TODO: Причесать вытащить в отдельный метод
      let keys = _.keys(filter);
      _.remove(self.taskList, (task, index) => {
        let listSize = _.size(self.taskList) - 1;
        let isRemove = true;
        let keysSize = _.size(keys);
        let deepKeysSize = 0;
        let countCompare = 0;
        let countDeepKeys = 0;
        let onRemove = false;

        if (index === 0 || index === listSize) {
          isRemove = false;
        }

        for (var i = 0; i < keys.length; i++) {
          let _key = keys[i];
          if (task.param[_key]) {
            if (_.keys(filter[_key]).length > 0 && _.isObject(filter[_key])) {
              keysSize = keysSize + _.keys(filter[_key]).length;
              let deepKeys = _.keys(filter[_key]);
              deepKeysSize = _.size(deepKeys);
              for (var i = 0; i < deepKeys.length; i++) {
                let deepKey = deepKeys[i];
                if (task.param[_key] && task.param[_key][deepKey]) {
                  if ( _.isEqual(task.param[_key][deepKey], filter[_key][deepKey]) ) {
                    countDeepKeys++
                  }
                }
              }
            }else{
              if ( _.isEqual(task.param[_key], filter[_key]) ) {
                countCompare++
              }
            }
          }
        }

        onRemove = (_.isEqual(keysSize, countCompare) && isRemove || _.isEqual(deepKeysSize, countDeepKeys) && isRemove);

        return onRemove;
      });
    }

    self.taskList.push({
      task: name,
      param
    })

    if (!self.lock) {
      self.taskSequencer();
    }
  }

  taskSequencer(){
    const self = this;
    return new Promise((resolve, reject) => {
    if (_.size(self.taskList) === 0){
      resolve();
      return;
    }

    if (self.options.statusBar) {
      var statusBar = new ProgressBar(self.options.statusBar.template, {
        complete: '█',
        incomplete: '.',
        width: 20,
        clear: true,
        total: self.taskList.length
      });
    }

    taskRunner();
    function taskRunner(){
      self.lock = true;
      delay(self.options.delay).then(() => {
        self.tasks[self.taskList[0].task](self.taskList[0].param).then(content => {
          let _content = content || {};

          self.taskList.splice(0, 1);
          self.lock = false;
          if (self.options.statusBar && statusBar) {
            statusBar.tick(_content);
          }

          if (_.size(self.taskList) > 0){
            return taskRunner();
          }else{
            resolve()
            return;
          }
        })
      })
    }
    });
  }

  getTaskList(){
    const self = this;
    console.log(self.tasks);
  }
}
export default options => new TaskManager(options);