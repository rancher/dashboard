export default (context) => {
  window.s = context.store;
  window.schemaName = type => context.store.getters['v1/schemaName'](type);
  window.schemaFor = type => context.store.getters['v1/schemaFor'](type, true);

  window.all = (type) => {
    const realType = window.schemaName(type);

    return context.store.getters['v1/all'](realType);
  };

  window.byId = (type, id) => {
    const realType = window.schemaName(type);

    return context.store.getters['v1/byId'](realType, id);
  };

  window.find = (type, id) => {
    const realType = window.schemaName(type);

    return context.store.dispatch('v1/find', {
      type: realType,
      id
    });
  };

  window.findAll = (type) => {
    const realType = window.schemaName(type);

    return context.store.dispatch('v1/findAll', { type: realType });
  };

  console.log('# Welcome to warp zone');
  console.log("# Try schemaFor('pod'), schemaName('pod'), all('pod'), byId('pod','abc'), await find('pod','abc'), await findAll('pod')");
};
