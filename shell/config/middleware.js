const middleware = {};

middleware['authenticated'] = require('../middleware/authenticated.js');
middleware['authenticated'] = middleware['authenticated'].default || middleware['authenticated'];

export default middleware;
