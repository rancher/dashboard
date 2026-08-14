/**
 * Add ignored paths based on env var configuration and known cases.
 * Webpack 5 accepts RegExp values for `watchOptions.ignored`.
 * https://webpack.js.org/configuration/watch/#watchoptionsignored
 */
const getWatcherIgnored = (excludes = []) => {
  const paths = [
    /node_modules/,
    /dist-pkg/,
    /scripts\/standalone/,
  ];
  const pathExcludedPkg = excludes.map((excluded) => new RegExp(`/pkg\\.${ excluded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }/`));
  const pathsCombined = [...paths, ...pathExcludedPkg];
  const regexCombined = new RegExp(pathsCombined.map(({ source }) => source).join('|'));

  return regexCombined;
};

module.exports = {
  getWatcherIgnored
};
