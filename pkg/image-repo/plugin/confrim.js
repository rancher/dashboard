import Vue from 'vue';
import Confrim from './Confrim.vue';

function confrim(options) {
  const confrimConstructor = Vue.extend(Confrim);
  const instance = new confrimConstructor({ propsData: options });

  instance.$store = options.store;
  instance.$mount();
  document.body.appendChild(instance.$el);
  instance.show = true;

  instance.$on('removed', () => {
    if (options?.removed && typeof options.removed === 'function') {
      options?.removed();
    }
  });

  return instance;
}

Vue.prototype.$customConfrim = confrim;
