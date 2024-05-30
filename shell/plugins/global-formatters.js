/* eslint-disable no-console */

const components = require.context('@shell/components/formatter', false, /[A-Z]\w+\.(vue)$/);

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

// TODO: #9539: Verify is still used
// // This is being done for backwards compatibility with our extensions that have written tests and didn't properly make use of vueApp.use() when importing and mocking vue plugins
// const isThisFileBeingExecutedInATest = process.env.NODE_ENV === 'test';

// if (isThisFileBeingExecutedInATest) {
//   console.warn('The implicit addition of global formatters has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `vueApp.use(globalFormatters)` to maintain compatibility.');

//   vueApp.use(globalFormatters);
// }
