import path from 'node:path';

/**
 * Write `report.json` beside the build: the modules in each chunk and the source files of each asset, by their path from
 * the app's root, in the shape of webpack-bundle-analyzer's JSON report (which scripts/analyze-licenses reads to find the
 * bundled packages)
 *
 * @param {{ root: string }} options the app's root directory
 */
export function rancherBundleReport({ root }) {
  return {
    name:  'rancher:bundle-report',
    apply: 'build',

    generateBundle(options, bundle) {
      const files = Object.values(bundle);
      const toReport = (ids) => ids.filter((id) => path.isAbsolute(id)).map((id) => ({ path: `./${ path.relative(root, id.split('?')[0]).split(path.sep).join('/') }` }));
      const chunks = files.filter((file) => file.type === 'chunk').map((chunk) => ({
        label:  chunk.fileName,
        groups: toReport(chunk.moduleIds.filter((id) => (chunk.modules[id]?.renderedLength ?? 1) > 0)),
      }));
      const assets = files.filter((file) => file.type === 'asset').map((asset) => ({
        label:  asset.fileName,
        groups: toReport((asset.originalFileNames || []).map((file) => path.resolve(root, file))),
      }));

      this.emitFile({ type: 'asset', fileName: 'report.json', source: JSON.stringify([...chunks, ...assets]) });
    },
  };
}
