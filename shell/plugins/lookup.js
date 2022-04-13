import { get, set } from '@shell/utils/object';
import $ from 'jquery';

const DEFAULT_NS = 'cluster';

export default (context) => {
  window.$ = $;
  window.get = get;
  window.set = set;

  window.s = context.store;

  window.schemaName = (type, namespace = DEFAULT_NS) => {
    return context.store.getters[`${ namespace }/schemaName`](type);
  };

  window.schemaFor = (type, namespace = DEFAULT_NS) => {
    return context.store.getters[`${ namespace }/schemaFor`](type, true);
  };

  window.all = (type, namespace = DEFAULT_NS) => {
    const realType = window.schemaName(type, namespace);

    return context.store.getters[`${ namespace }/all`](realType);
  };

  window.byId = (type, id, namespace = DEFAULT_NS) => {
    const realType = window.schemaName(type, namespace);

    return context.store.getters[`${ namespace }/byId`](realType, id);
  };

  window.find = (type, id, namespace = DEFAULT_NS) => {
    const realType = window.schemaName(type, namespace);

    return context.store.dispatch(`${ namespace }/find`, {
      type: realType,
      id
    });
  };

  window.findAll = (type, namespace = DEFAULT_NS) => {
    const realType = window.schemaName(type, namespace);

    return context.store.dispatch(`${ namespace }/findAll`, { type: realType });
  };

  console.log('# Welcome to warp zone'); // eslint-disable-line no-console
  console.log("# Try schemaFor('pod'), schemaName('pod'), all('pod'), byId('pod','abc'), await find('pod','abc'), await findAll('pod')"); // eslint-disable-line no-console
};
