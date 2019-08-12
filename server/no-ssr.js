import url from 'url';

export default function(req, res, next) {
  const parsed = url.parse(req.url, true);

  if ( typeof parsed.query['spa'] !== 'undefined' ) {
    res.spa = true;
    console.log('SPA mode enabled');
  }

  next();
}
