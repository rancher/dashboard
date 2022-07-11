function setDebug(isDebug = false) {
  const timestamp = function() {};

  timestamp.toString = function() {
    const ts = new Date();
    const pad = '000';
    const ms = ts.getMilliseconds().toString();
    const timestamp = `${ ts.toLocaleTimeString('de-DE') }.${ pad.substring(0, pad.length - ms.length) }${ ms }: `;

    return timestamp;
  };

  if (isDebug) {
    window.debug = {
      log:   window.console.log.bind(window.console, '%s', timestamp),
      error: window.console.error.bind(window.console, '%s', timestamp),
      info:  window.console.info.bind(window.console, '%s', timestamp),
      warn:  window.console.warn.bind(window.console, '%s', timestamp)
    };
  } else {
    const noOp = function() {};

    window.debug = {
      log:   noOp,
      error: noOp,
      warn:  noOp,
      info:  noOp
    };
  }
}

// this will enable our console.log wrapper function and prevent logs in PROD
if (process.env.NODE_ENV !== 'production' && (process.client || process.browser)) {
  setDebug(true);
} else if (process.client || process.browser) {
  setDebug(false);
}
