import { createStore } from 'vuex'
import IntlMessageFormat from 'intl-messageformat';
const i18nStrings = require('@shell/assets/translations/en-us.yaml');

import { get } from '@shell/utils/object';

// Store modules
import growl from './growl';
import codeMirror from './codeMirror';
import table from './table';

const store = createStore({
  getters: {
    'i18n/exists': key => store.getters['i18n/t'],
    'i18n/t': state =>(key, args) => {
      const text = get(i18nStrings, key) || key;
      if (text?.includes('{')) {
        const formatter = new IntlMessageFormat(text, state.selected);
        return formatter.format(args);
      }

      return text;
    },
  },
  modules: {
    growl,
    codeMirror,
    table
  }
});

export default store;
