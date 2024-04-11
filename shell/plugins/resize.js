import VueResize from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';

export default {
  install(Vue, _options) {
    Vue.use(VueResize);
  }
};
