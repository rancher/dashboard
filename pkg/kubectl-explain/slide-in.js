import Panel from './components/SlideInPanel';

/**
 * Show the slide-in panel with the resource explanation
 */
export async function explain(store, route, returnFocusSelector) {
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;
  const cluster = store.getters['currentCluster'] || 'local';

  const onClose = () => store.commit('slideInPanel/close', undefined, { root: true });

  store.commit('slideInPanel/open', {
    component:      Panel,
    componentProps: {
      resource:           this,
      onClose,
      width:              '50%',
      // We want this to be full viewport height top to bottom
      height:             '100vh',
      top:                '0',
      'z-index':          101, // We want this to be above the main side menu
      closeOnRouteChange: ['name', 'params', 'query'], // We want to ignore hash changes, tables in extensions can trigger the drawer to close while opening
      triggerFocusTrap:   true,
      returnFocusSelector,
      schema,
      cluster
    }
  }, { root: true });
}
