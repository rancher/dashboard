import cookieUniversal from 'cookie-universal';

export default (context, inject, Vue) => {
  const { req, res } = context;
  const options = {
    alias:     'cookies',
    parseJSON: true
  };

  inject(options.alias, cookieUniversal(req, res, options.parseJSON), context, Vue);
};
