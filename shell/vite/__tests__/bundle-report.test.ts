import { rancherBundleReport } from '@shell/vite/bundle-report.mjs';

const ROOT = '/app';

const report = (bundle: Record<string, any>) => {
  const emitted: any[] = [];

  (rancherBundleReport({ root: ROOT }) as any).generateBundle.call({ emitFile: (file: any) => emitted.push(file) }, {}, bundle);

  return { file: emitted[0], groups: JSON.parse(emitted[0].source) };
};

describe('fx: rancherBundleReport', () => {
  it('should write report.json', () => {
    expect(report({}).file).toStrictEqual({
      type: 'asset', fileName: 'report.json', source: '[]'
    });
  });

  it('should list the modules of each chunk by their path from the root', () => {
    const { groups } = report({
      'js/app.js': {
        type:      'chunk',
        fileName:  'js/app.js',
        moduleIds: [`${ ROOT }/node_modules/vue/dist/vue.runtime.esm-bundler.js`, `${ ROOT }/shell/components/Thing.vue?vue&type=script`],
        modules:   {
          [`${ ROOT }/node_modules/vue/dist/vue.runtime.esm-bundler.js`]: { renderedLength: 10 },
          [`${ ROOT }/shell/components/Thing.vue?vue&type=script`]:       { renderedLength: 10 },
        },
      },
    });

    expect(groups).toStrictEqual([{ label: 'js/app.js', groups: [{ path: './node_modules/vue/dist/vue.runtime.esm-bundler.js' }, { path: './shell/components/Thing.vue' }] }]);
  });

  it.each([
    ['a virtual module', '\0vite/preload-helper.js', 10],
    ['a module that was tree-shaken away', `${ ROOT }/node_modules/d3/src/index.js`, 0],
  ])('should leave out %s', (_, id, renderedLength) => {
    const { groups } = report({
      'js/app.js': {
        type: 'chunk', fileName: 'js/app.js', moduleIds: [id], modules: { [id]: { renderedLength } }
      },
    });

    expect(groups[0].groups).toStrictEqual([]);
  });

  it('should list the source files of each asset', () => {
    const { groups } = report({
      'fonts/icons.woff': {
        type: 'asset', fileName: 'fonts/icons.woff', originalFileNames: ['node_modules/@rancher/icons/fonts/icons.woff']
      },
    });

    expect(groups).toStrictEqual([{ label: 'fonts/icons.woff', groups: [{ path: './node_modules/@rancher/icons/fonts/icons.woff' }] }]);
  });
});
