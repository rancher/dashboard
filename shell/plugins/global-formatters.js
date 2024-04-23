const components = require.context('@shell/components/formatter', false, /[A-Z]\w+\.(vue)$/);

const globalFormatter = {
  install: (Vue) => {
    components.keys().forEach((fileName) => {
      const componentConfig = components(fileName);
      const componentName = fileName.split('/').pop().split('.')[0];

      if (Vue.component(componentName)) {
        // eslint-disable-next-line no-console
        console.debug(`Skipping ${ componentName } install. Component already exists.`);
      } else {
        Vue.component(componentName, componentConfig.default || componentConfig);
      }
    });
  }
};

export default globalFormatter;
