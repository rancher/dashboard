const middleware = {}

middleware['authenticated'] = require('../shell/middleware/authenticated.js')
middleware['authenticated'] = middleware['authenticated'].default || middleware['authenticated']

middleware['i18n'] = require('../shell/middleware/i18n.js')
middleware['i18n'] = middleware['i18n'].default || middleware['i18n']

middleware['unauthenticated'] = require('../shell/middleware/unauthenticated.js')
middleware['unauthenticated'] = middleware['unauthenticated'].default || middleware['unauthenticated']

export default middleware
