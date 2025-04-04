const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// When we receive a request to this URL we will reset the session to replay again from the HAR file
// This allows the user to refresh the browser and replay the HAR file again
const RESET_URL = '/api/v1/namespaces/cattle-ui-plugin-system/services/http:ui-plugin-operator:80/proxy/index.json';

const EXCLUDE_QS = 'exclude';

const LEGACY_UI_PLUGIN_INDEX = '/api/v1/namespaces/cattle-ui-plugin-system/services/http:ui-plugin-operator:80/proxy/index.json';
const NEW_UI_PLUGIN_INDEX = '/v1/uiplugins';

/**
 * Load the network requests/responses from the har file
 * @param name name/path of the file
 * @param port port that the local dev server is running on
 * @returns har file data
 */
function loadFile(name, port, dashboard) {
  const newBase = `https://127.0.0.1:${ port }`;
  const data = {};

  console.log(`Loading HAR file: ${ name }`); // eslint-disable-line no-console

  const rawData = fs.readFileSync(name);
  const har = JSON.parse(rawData);
  let base = '';
  let uri = '';

  if (har?.log?.pages) {
    const page = har.log.pages.find((page) => page.title.includes('/dashboard/'));

    if (page) {
      const parts = page.title.split('/dashboard');

      base = parts[0];
      uri = parts[1];
    }
  }

  if (har?.log?.entries) {
    console.log('Network requests:'); // eslint-disable-line no-console

    har.log.entries.forEach((r) => {
      const mimeType = r.response.content.mimeType;

      // Only cache json responses
      if (mimeType === 'application/json' || mimeType === 'text/plain') {
        let url = r.request.url;

        if (url.startsWith(base)) {
          url = url.substr(base.length);
        }

        console.log(`    ${ r.request.method } ${ decodeURIComponent(url) }`); // eslint-disable-line no-console

        data[url] = data[url] || {};
        data[url][r.request.method] = data[url][r.request.method] || [];

        const item = {
          status:     r.response.status,
          statusText: r.response.statusText,
          headers:    r.response.headers,
          content:    r.response.content
        };

        if (item.content.text) {
          item.content.text = item.content.text.replaceAll(base, newBase);
          data[url][r.request.method].push(item);
        } else {
          console.log('        Warning: Omitting this response as there is no content - UI may not work as expected'); // eslint-disable-line no-console
        }
      }
    });
  }

  console.log('Page:'); // eslint-disable-line no-console
  console.log(`    ${ newBase }${ dashboard }${ uri }`); // eslint-disable-line no-console
  console.log(''); // eslint-disable-line no-console

  return data;
}

function exportToFiles(data, folder) {
  console.log(`Exporting request data to ${ folder }`); // eslint-disable-line no-console

  Object.keys(data).forEach((r) => {
    const out = path.join(folder, `.${ r }`);
    const dir = path.dirname(out);

    console.log(r); // eslint-disable-line no-console

    Object.keys(data[r]).forEach((method) => {
      const name = `${ path.basename(out) }.${ method.toLowerCase() }.json`;

      fs.mkdirSync(dir, { recursive: true });

      data[r][method].forEach((request) => {
        const formatted = JSON.stringify(JSON.parse(request.content.text), null, 2);

        fs.writeFileSync(path.join(dir, name), formatted);
      });
    });
  });
}

function harProxy(responses, folder) {
  let session = JSON.parse(JSON.stringify(responses));

  return (req, res, next) => {
    if (req.originalUrl === RESET_URL) {
      session = JSON.parse(JSON.stringify(responses));
      console.log('>>>>>>>> Reset session replay from har file'); // eslint-disable-line no-console
    }

    const url = decodeURIComponent(req.originalUrl);
    let playback = session[req.originalUrl];

    // Handle case where HAR file was created with older UI Extension API that used the operator
    if (!playback && req.originalUrl.includes(NEW_UI_PLUGIN_INDEX)) {
      // Look for new URl for UI plugins
      playback = session[LEGACY_UI_PLUGIN_INDEX];
    }

    // If it did not match, try without the metadata excludes query string that was adding in 2.8.0
    // This might allow HAR captures with Rancher < 2.8.0 to be replayed on >= 2.8.0
    if (!playback && req.originalUrl.includes('?')) {
      const urlParts = req.originalUrl.split('?');

      if (urlParts.length > 1) {
        const queryString = urlParts[1];
        const qs = querystring.parse(queryString);

        delete qs[EXCLUDE_QS];

        const newQs = querystring.stringify(qs);
        const newUrl = newQs.length ? `${ urlParts[0] }?${ newQs }` : urlParts[0];

        playback = session[newUrl];
      }
    }

    if (playback && playback[req.method] && playback[req.method].length) {
      const resp = playback[req.method][0];

      if (playback[req.method].length > 1) {
        playback[req.method].shift();
      }

      const body = resp.content?.text || '';

      res.type(resp.content.mimeType);
      res.status(resp.status);
      res.send(Buffer.from(body));
      res.end();

      const char = !!resp.used ? '*' : ' ';

      console.log(`${ req.method }${ char } ${ resp.status } ${ url }`); // eslint-disable-line no-console

      resp.used = true;

      return;
    }

    if (req.originalUrl.startsWith('/v1/') || req.originalUrl.startsWith('/v3/') || req.originalUrl.startsWith('/k8s/')) {
      // If we have been configured with a folder, look for a file with the contents to use for the request
      if (folder) {
        // Remove query string
        const name = req.originalUrl.split('?')[0];
        const requestFile = path.join(folder, `.${ name }.${ req.method.toLowerCase() }.json`);

        if (fs.existsSync(requestFile)) {
          const data = fs.readFileSync(requestFile);

          console.log(`${ req.method }f 200 ${ url }`); // eslint-disable-line no-console

          res.type('application/json');
          res.status(200);
          res.send(data);

          return res.end();
        }
      }

      // Fallback to sending a 404 response
      res.status(404);
      res.send('Not Found');

      console.log(`${ req.method }? 404 ${ url }`); // eslint-disable-line no-console

      return res.end();
    }

    // Continue on to serve up other resources
    return next();
  };
}

module.exports = {
  loadFile,
  harProxy,
  exportToFiles,
};
