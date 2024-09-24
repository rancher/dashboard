import { createApp } from 'vue';
import cleanHtmlDirective from '@shell/directives/clean-html';
import i18n from '@shell/plugins/i18n';

import Panel from './components/SlideInPanel';
import { OpenAPI } from './open-api';

const PANEL_ID = 'kubectl-explain';

// Cache of the Open API Data for a cluster
const openAPI = new OpenAPI();

// Slide in panel component
let slideInPanel;

/**
 * Show the slide-in panel with the resource explanation
 */
export async function explain(store, route) {
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;
  const cluster = store.getters['currentCluster'] || 'local';

  // Create slide-in panel, if this is the first-time it is being shown
  if (!slideInPanel) {
    // Create a DIV that we can mount the slide-in panel component into
    const div = document.createElement('div');

    div.id = PANEL_ID;
    document.body.appendChild(div);

    const slideInPanelApp = createApp(Panel);

    slideInPanelApp.directive('clean-html', cleanHtmlDirective);
    slideInPanelApp.use(store);
    slideInPanelApp.use(i18n, { store });
    slideInPanel = slideInPanelApp.mount(`#${ PANEL_ID }`);
  }

  // Open the slide-in panel
  setTimeout(() => {
    slideInPanel.open();

    // Fetch the open API data for the cluster
    openAPI.get(cluster?.id, store.dispatch).then((data) => {
      slideInPanel.load(data, schema);
    }).catch((e) => {
      slideInPanel.load(undefined, schema, e);
    });
  }, 0);
}
