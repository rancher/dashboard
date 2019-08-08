const all = {};

export function get(name) {
  return all[name];
}

export function register(obj) {
  const type = obj.prototype.type;

  if ( !type ) {
    throw new Error('Must specify the "type" property on the model');
  }

  all[type] = obj;
}

export default {
  get,
  register
};
