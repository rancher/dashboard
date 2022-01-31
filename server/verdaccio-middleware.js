import { URL } from 'url';
import fs from 'fs-extra';
import path from 'path';
import tar from 'tar';
import http from 'http';

export default function(req, res, next) {
  const parsed = new URL(req.url, 'https://localhost');

  if (req.url.startsWith('/download-pkg')) {
    const urlp = req.url.split('/');
    const pkg = urlp[urlp.length - 1];
    const name = pkg.split('-')[0];
    
    const downloadFolder = path.resolve(__dirname, '..', '..', 'dist-pkg');
    const pkgFolder = path.resolve(downloadFolder, pkg);

    // If the package is already there, use that
    if (fs.existsSync(pkgFolder)) {
      res.statusCode = 200;
      res.write('OK');
      return res.end();
    }

    // Need to download
    const url = `http://127.0.0.1:4873/${ name }/-/${ pkg }.tgz`;

    console.log('DOWNLOAD PACKAGE');
    console.log(url);
    const destPath = path.join(downloadFolder, `${ pkg }.tgz`);
    const dest = fs.createWriteStream(destPath);

    dest.on('open', () => {
      http.get(url, (response) => {
        response.pipe(dest);
      }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        res.status = 500;
        res.write('ERROR');
        res.end();
      });
    });

    dest.on('finish', () => {
      dest.close(() => {
        console.log('File downloaded');
        fs.ensureDirSync(pkgFolder);
        tar.x({
          file:  destPath,
          strip: 1,
          C:     pkgFolder
        }).then(() => {
          console.log('tar file expanded');
          res.statusCode = 200;
          res.write('OK');
          res.end();
        });
      });
    });
  } else {
    next();
  }

  // if ( parsed.searchParams.has('spa') ) {
  //   res.spa = true;
  //   console.log('SPA mode enabled'); // eslint-disable-line no-console
  // }

  // // We do this redirect so that /verify-auth can work with both standalone and
  // // while dashboard is nested under ember.
  // if (req.url.includes('/verify-auth') || req.url.includes('/verify-auth-azure')) {
  //   res.writeHead(301, { Location: req.url.replace(/verify-auth(-azure)?/, 'auth/verify') });
  //   res.end();
  // }
}
