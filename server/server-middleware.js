import { URL } from 'url';

export default function(req, res, next) {
  const parsed = new URL(req.url, 'https://localhost');

  if ( parsed.searchParams.has('spa') ) {
    res.spa = true;
    console.log('SPA mode enabled'); // eslint-disable-line no-console
  }

  // We do this redirect so that /verify-auth-azure/dashboard/auth/verify can work with both standalone and
  // while dashboard is nested under ember.
  if (req.url.includes('/verify-auth-azure/dashboard/auth/verify')) {
    res.writeHead(301, { Location: req.url.replace('/verify-auth-azure/dashboard', '') });
    res.end();
  }

  next();
}
