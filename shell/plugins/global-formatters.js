const modules = import.meta.glob('@shell/components/formatter/[A-Z]*.vue', { eager: true });

const globalFormatters = {
  install: (vueApp) => {
    Object.entries(modules).forEach(([filePath, componentConfig]) => {
      const componentName = filePath.split('/').pop().split('.')[0];

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
