const middleware = {};

middleware['authenticated'] = require('../middleware/authenticated.js');
middleware['authenticated'] = middleware['authenticated'].default || middleware['authenticated'];

middleware['i18n'] = require('../middleware/i18n.js');
middleware['i18n'] = middleware['i18n'].default || middleware['i18n'];

middleware['unauthenticated'] = require('../middleware/unauthenticated.js');
middleware['unauthenticated'] = middleware['unauthenticated'].default || middleware['unauthenticated'];

export default middleware;
