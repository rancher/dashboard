import Panel from './components/SlideInPanel';

const RETURN_FOCUS_SELECTOR = '[data-testid="extension-header-action-kubectl-explain.action"]';

/**
 * Whether the resource explanation is the slide-in panel currently on screen
 */
export function isExplainPanelOpen(store) {
  return store.getters['slideInPanel/isOpen'] && store.getters['slideInPanel/component'] === Panel;
}

/**
 * Show the slide-in panel with the resource explanation
 */
export function explain(store, route) {
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;
  const cluster = store.getters['currentCluster'] || 'local';

  store.$shell.slideIn.open(Panel, {
    props:               { schema, cluster: cluster?.id },
    width:               'wide',
    height:              'full',
    closeOnRouteChange:  ['name', 'params', 'query'],
    returnFocusSelector: RETURN_FOCUS_SELECTOR
  });
}
