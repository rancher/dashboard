import { createStore } from 'vuex'

import { get } from '../../../shell/utils/object';
const i18nStrings = require('../../../shell/assets/translations/en-us.yaml');
import IntlMessageFormat from 'intl-messageformat';

// Store modules
import growl from './growl';
import codeMirror from './codeMirror';
import table from './table';


const store = createStore({
  getters: {
    'i18n/exists': key => store.getters['i18n/t'],
    'i18n/t': state => (key, args) => {
      const msg = get(i18nStrings, key) || key;

      if (msg?.includes('{')) {
        const formatter = new IntlMessageFormat(msg, state.selected);
        return formatter.format(args);
      }

      return msg;
    },
  },
  modules: {
    growl,
    codeMirror,
    table
  }
});

export default store;
