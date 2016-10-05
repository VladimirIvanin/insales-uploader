import _ from 'lodash';
import opn from 'opn';

export function startBrowser (url, options) {
  if (options && options.start || options.launch) {
    const _option = _.omit(options, ['start', 'launch']);
    opn(url, options)
  }
}
