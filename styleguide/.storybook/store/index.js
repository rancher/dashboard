import { createStore } from 'vuex'
import IntlMessageFormat from 'intl-messageformat';

// Store modules
import growl from './growl';
import codeMirror from './codeMirror';
import table from './table';


const store = createStore({
  getters: {
    'i18n/exists': key => store.getters['i18n/t'],
    'i18n/t': state => (key, args) => {
      if (key?.includes('{')) {
        const formatter = new IntlMessageFormat(key, state.selected);
        return formatter.format(args);
      }

      return key;
    },
  },
  modules: {
    growl,
    codeMirror,
    table
  }
});

export default store;
