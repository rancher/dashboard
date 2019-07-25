function create(status, obj, message) {
  obj = obj || {};

  obj.status = status;

  if ( message ) {
    obj.message = message;
  }

  switch (status) {
  case 400:
    return new ClientError(obj);
  case 401:
    return new UnauthorizedError(obj);
  case 403:
    return new ForbiddenError(obj);
  case 404:
    return new NotFoundError(obj);
  case 422:
    return new ValidationError(obj);
  case 500:
    return new ServerError(obj);
  case 504:
    return new ProxyError(obj);
  default:
    return new ApiError(obj);
  }
}

class ApiError {
  constructor() {
    copy(this, this.defaults || {});

    for ( let i = 0 ; i < arguments.length ; i++ ) {
      copy(this, arguments[i]);
    }

    function copy(tgt, map) {
      Object.keys(map).forEach((key) => {
        tgt[key] = map[key];
      });
    }

    const e = new Error();

    this.stack = e.stack.split(/\n/).slice(1).map((x) => x.replace(/^\s+at /, ''));
  }

  log(req, res, str) {
    console.error(`${ this.logPrefix }${ req.method  } to`, req.url, str);
  }

  respond(req, res) {
    this.method = req.method;
    this.path = req.originalUrl;

    const str = `${ JSON.stringify(this, null, 2)  }\n`;

    this.log(req, res);

    if ( req.upgrade ) {
      // Nothing much you can do here in the middle of a websocket
      res.end();
    } else {
      console.log('ERROR STATUS: ', this);
      res.writeHead(this.status || 599, { 'Content-Type': 'application/json' });
      res.end(str);
    }
  }
}

function setDefaults(cls, obj) {
  const def = Object.assign({}, cls.prototype.defaults || {});

  cls.prototype.defaults = def;

  Object.keys(obj).forEach((key) => {
    def[key] = obj[key];
  });
}

ApiError.prototype.logPrefix = '[ERROR]';
setDefaults(ApiError, {
  type:       'error',
  status:     0,
  code:       'Error',
});

// ##################

class ClientError extends ApiError {}

setDefaults(ClientError, {
  status:  400,
  code:    'ClientError',
});

// ##################

class UnauthorizedError extends ApiError {}

setDefaults(UnauthorizedError, {
  status:  401,
  code:    'Unauthorized',
  message: 'Must authenticate'
});

// ##################

class ForbiddenError extends ApiError {}

setDefaults(ForbiddenError, {
  status:  403,
  code:    'Forbidden',
});

// ##################

class ValidationError extends ApiError {}

setDefaults(ValidationError, {
  status:  422,
  code:    'ValidationError',
});

class InvalidActionError extends ApiError {}

setDefaults(InvalidActionError, {
  status:  422,
  code:    'InvalidActionError',
});

class MissingRequiredError extends ApiError {}

setDefaults(MissingRequiredError, {
  status:  422,
  code:    'MissingRequiredError',
});

// ##################

class NotFoundError extends ApiError {}

setDefaults(NotFoundError, {
  status:  404,
  code:    'NotFound',
});

// ##################

class ServerError extends ApiError {}

setDefaults(ServerError, {
  status:  500,
  code:    'ServerError',
});

// ##################

class ProxyError extends ApiError {}

setDefaults(ProxyError, {
  status:  504,
  code:    'ProxyError',
  message: 'Error connecting to proxy',
});

// ##################

// ##################
module.exports = exports = {
  create,
  ApiError,
  ClientError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ServerError,
  ProxyError,
}
