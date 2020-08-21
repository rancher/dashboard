import { get, set } from '@/utils/object';

export default (context) => {
  window.get = get;
  window.set = set;

  window.s = context.store;
  window.schemaName = type => context.store.getters['cluster/schemaName'](type);
  window.schemaFor = type => context.store.getters['cluster/schemaFor'](type, true);

  window.all = (type, namespace = 'cluster') => {
    const realType = window.schemaName(type);

    return context.store.getters[`${ namespace }/all`](realType);
  };

  window.byId = (type, id, namespace = 'cluster') => {
    const realType = window.schemaName(type);

    return context.store.getters[`${ namespace }/byId`](realType, id);
  };

  window.find = (type, id, namespace = 'cluster') => {
    const realType = window.schemaName(type);

    return context.store.dispatch(`${ namespace }/find`, {
      type: realType,
      id
    });
  };

  window.findAll = (type, namespace = 'cluster') => {
    const realType = window.schemaName(type);

    return context.store.dispatch(`${ namespace }/findAll`, { type: realType });
  };

  console.log('# Welcome to warp zone'); // eslint-disable-line no-console
  console.log("# Try schemaFor('pod'), schemaName('pod'), all('pod'), byId('pod','abc'), await find('pod','abc'), await findAll('pod')"); // eslint-disable-line no-console
};
