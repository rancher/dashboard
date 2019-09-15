export default (context) => {
  window.s = context.store;
  window.schemaName = type => context.store.getters['cluster/schemaName'](type);
  window.schemaFor = type => context.store.getters['cluster/schemaFor'](type, true);

  window.all = (type) => {
    const realType = window.schemaName(type);

    return context.store.getters['cluster/all'](realType);
  };

  window.byId = (type, id) => {
    const realType = window.schemaName(type);

    return context.store.getters['cluster/byId'](realType, id);
  };

  window.find = (type, id) => {
    const realType = window.schemaName(type);

    return context.store.dispatch('cluster/find', {
      type: realType,
      id
    });
  };

  window.findAll = (type) => {
    const realType = window.schemaName(type);

    return context.store.dispatch('cluster/findAll', { type: realType });
  };

  console.log('# Welcome to warp zone');
  console.log("# Try schemaFor('pod'), schemaName('pod'), all('pod'), byId('pod','abc'), await find('pod','abc'), await findAll('pod')");
};
