module.exports = function(req, res, next) {
  // We do this redirect so that /verify-auth can work with both standalone and
  // while dashboard is nested under ember.
  if (req.url.includes('/verify-auth') || req.url.includes('/verify-auth-azure')) {
    res.writeHead(301, { Location: req.url.replace(/verify-auth(-azure)?/, 'auth/verify') });
    res.end();

    return;
  }
  next();
};
