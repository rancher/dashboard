import http from 'http';
import path from 'path';
import fs from 'fs-extra';
import tar from 'tar';

export default function(req, res, next) {
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
    const destPath = path.join(downloadFolder, `${ pkg }.tgz`);
    const dest = fs.createWriteStream(destPath);

    dest.on('open', () => {
      http.get(url, (response) => {
        response.pipe(dest);
      }).on('error', () => {
        fs.unlink(dest);
        res.status = 500;
        res.write('ERROR');
        res.end();
      });
    });

    dest.on('finish', () => {
      dest.close(() => {
        fs.ensureDirSync(pkgFolder);
        tar.x({
          file:  destPath,
          strip: 1,
          C:     pkgFolder
        }).then(() => {
          res.statusCode = 200;
          res.write('OK');
          res.end();
        });
      });
    });
  } else {
    next();
  }
}
