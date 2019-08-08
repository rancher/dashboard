import Vue from 'vue';

const components = require.context('@/components/formatters', false, /[A-Z]\w+\.(vue)$/);

components.keys().forEach((fileName) => {
  const componentConfig = components(fileName);
  const componentName = fileName.split('/').pop().split('.')[0];

  console.log(componentName);
  Vue.component(componentName, componentConfig.default || componentConfig);
});
