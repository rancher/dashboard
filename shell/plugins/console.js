/* eslint-disable no-console */
export default () => {
  const logTypes = ['warn', 'error'];
  const MAX_LOGS_STORED = 400;

  if (!process.env.dev) {
    console.logLog = console.log.bind(console);
    console.infoLog = console.info.bind(console);
    logTypes.push('log');
    logTypes.push('info');
  }

  console.warnLog = console.warn.bind(console);
  console.errorLog = console.error.bind(console);
  console.logs = [];

  logTypes.forEach((type) => {
    console[type] = function() {
      const dataLogged = {
        type,
        dateTimeUtc: new Date().toUTCString(),
        timestamp:   Date.now(),
        data:        Array.from(arguments)
      };

      if (console.logs.length >= MAX_LOGS_STORED) {
        console.logs.shift();
      }

      console.logs.push(dataLogged);
      console[`${ type }Log`].apply(console, arguments);
    };
  });
};
