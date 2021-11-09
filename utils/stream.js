export function streamJson(url, opt, onData) {
  opt = opt || {};
  opt.method = opt.method || 'get';
  opt.headers = opt.headers || {};
  opt.headers.accept = 'application/jsonl';

  const decoder = new TextDecoder();
  let buf = '';

  return fetch(url, opt)
    .then((res) => {
      if ( res.status >= 400 ) {
        // eslint-disable-next-line no-console
        console.error('Error Streaming', res);

        const out = { message: 'Error Streaming' };

        out.response = res;

        return Promise.reject(out);
      } else {
        return res.body.getReader();
      }
    }).then((reader) => {
      return reader.read().then(function process({ value, done }) {
        if (done) {
          onData(JSON.parse(buf));

          return;
        }

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split(/[\r\n](?=.)/);

        buf = lines.pop();
        lines.map(JSON.parse).forEach(onData);

        return reader.read().then(process);
      });
    });
}

export function streamingSupported() {
  const supported = typeof TextDecoder !== 'undefined';

  // console.log('Streaming Supported: ', supported);

  return supported;
}
