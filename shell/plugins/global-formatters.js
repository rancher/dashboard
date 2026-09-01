/* eslint-disable no-console */
const components = require.context('@shell/components/formatter', false, /\.\/[A-Z]\w+\.(vue)$/);

const globalFormatters = {
  install: (vueApp) => {
    components.keys().forEach((fileName) => {
      const componentConfig = components(fileName);
      const componentName = fileName.split('/').pop().split('.')[0];

      if (vueApp.component(componentName)) {
        // eslint-disable-next-line no-console
        console.debug(`Skipping ${ componentName } install. Component already exists.`);
      } else {
        vueApp.component(componentName, componentConfig.default || componentConfig);
      }
    });
  }
};

export default globalFormatters;
