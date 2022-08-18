/* eslint-disable no-console */
export default (context) => {
  const logTypes = ['log', 'error', 'info', 'warn'];
  const MAX_LOGS_STORED = 400;

  console.logLog = console.log.bind(console);
  console.errorLog = console.error.bind(console);
  console.infoLog = console.info.bind(console);
  console.warnLog = console.warn.bind(console);
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
