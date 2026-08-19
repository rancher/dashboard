import { SlideInApiImpl } from '@shell/apis/shell/slide-in';
import ExplainDrawer from './components/ExplainDrawer.vue';

/**
 * Show the drawer with the resource explanation
 */
export function explain(store, route) {
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;
  const cluster = store.getters['currentCluster'];

  new SlideInApiImpl(store).open(ExplainDrawer, {
    width:  'wide',
    height: 'full',
    props:  {
      schema,
      clusterId: cluster?.id || 'local'
    }
  });
}
