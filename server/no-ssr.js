import { URL } from 'url';

export default function(req, res, next) {
  const parsed = new URL(req.url, 'https://localhost');

  if ( parsed.searchParams.has('spa') ) {
    res.spa = true;
    console.log('SPA mode enabled');
  }

  next();
}
