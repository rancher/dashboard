import Vue from 'vue';
import Vuex from 'vuex';

// const i18n = require('../store/i18n');

// require('../plugins/i18n');

// console.log(i18n);

//const store = require('./store');

Vue.use(Vuex);

const store = new Vuex.Store({
  getters: {
    'i18n/t': state => (key, args) => {
      console.log('get');

      return key;
    }
  }
});

const storePlugin = {
  store,
  install (Vue, options) {
    Vue.prototype.$store = store
  }
};

Vue.use(storePlugin);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  layout: 'centered',
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

// export const globalTypes = {
//   language: {
//     name: "i18n",
//     description: "i18n selector",
//     defaultValue: "en",
//     toolbar: {
//       items: ["en", "fr"],
//     },
//   },
//   lightTheme: {
//     name: "Light",
//     description: "theme selector",
//     defaultValue: "light",
//     toolbar: {
//       showName: true,
//       items: []
//     },
//   },
//   darkTheme: {
//     name: "Dark",
//     description: "theme selector",
//     defaultValue: "dark",
//     toolbar: {
//       showName: true,
//       items: []
//     },
//   },
// };

