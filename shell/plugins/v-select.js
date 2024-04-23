import vueSelect from 'vue-select';

const vSelect = {
  install: (Vue) => {
    if (Vue.component('v-select')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping v-select install. Component already exists.');
    } else {
      Vue.component('v-select', vueSelect);
    }
  }
};

export default vSelect;
