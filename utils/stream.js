export function streamJson(url, opt, onData) {
  opt = opt || {};
  opt.method = opt.method || 'get';
  opt.headers = opt.headers || {};
  opt.headers.accept = 'application/jsonl';

  const decoder = new TextDecoder();
  let buf = '';

  return fetch(url, opt)
    .then(res => res.body.getReader())
    .then((reader) => {
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
