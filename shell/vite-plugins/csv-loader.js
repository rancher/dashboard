/**
 * Transforms .csv files into JS module exports using Papa Parse.
 * Replaces csv-loader from webpack config.
 *
 * Matches the same options as the webpack csv-loader config:
 * dynamicTyping: true, header: true, skipEmptyLines: true
 */
function csvPlugin() {
  return {
    name: 'rancher-csv-loader',

    async transform(code, id) {
      if (!/\.csv$/i.test(id)) {
        return null;
      }

      // Use dynamic import to avoid requiring papaparse at config load time
      const Papa = await import('papaparse');
      const result = Papa.default.parse(code, {
        dynamicTyping:  true,
        header:         true,
        skipEmptyLines: true,
      });

      return {
        code: `export default ${ JSON.stringify(result.data) };`,
        map:  null,
      };
    },
  };
}

module.exports = { csvPlugin };
