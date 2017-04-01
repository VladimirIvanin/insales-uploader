'use strict';
import _ from 'lodash';
import clc from 'cli-color';

const log_edit = clc.xterm(40);
const log_error = clc.xterm(9);
const log_warn = clc.xterm(221);
const log_notice = clc.xterm(33);
const log_remove = clc.xterm(196);
const log_white = clc.xterm(254);
const log_label = clc.xterm(81);
const log_text = clc.xterm(254);
const log_start = clc.xterm(129);

/**
 * Получить функции которые окрашивают логи.
 */
export function getColor() {
  const methods = {};

  methods.remove = clc.xterm(196);
  methods.edit = clc.xterm(40);
  methods.notice = clc.xterm(33);
  methods.error = clc.xterm(9);
  methods.warn = clc.xterm(221);
  methods.white = clc.xterm(254);
  methods.label = clc.xterm(81);
  methods.text = clc.xterm(254);
  methods.start = clc.xterm(129);

  return methods;
}
