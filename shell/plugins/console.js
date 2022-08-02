/* eslint-disable */
export default (context) => {
  const logTypes = ['log', 'error', 'info', 'warn'];
  const MAX_LOGS_STORED = 200;

  console.logLog = console.log.bind(console);
  console.errorLog = console.error.bind(console);
  console.infoLog = console.info.bind(console);
  console.warnLog = console.warn.bind(console);
  console.logs = [];

  logTypes.forEach((type) => {
    console[type] = function() {
      const dataLogged = {
        type,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        data: Array.from(arguments)
      }

      if (console.logs.length >= MAX_LOGS_STORED) {
        console.logs.shift()
      }

      console.logs.push(dataLogged);
      console[`${ type }Log`].apply(console, arguments);
    };
  });
};
