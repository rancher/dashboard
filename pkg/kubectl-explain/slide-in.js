import Vue from 'vue';

import Panel from './SlideInPanel';
import { OpenAPI } from './open-api';

const PANEL_ID = 'kubectl-explain';

const openAPI = new OpenAPI();

// Slide in panel component
let slideInPanel;

/**
 * Show the slide-in panel with the resource explanation
 */
export async function explain(store, route) {
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;
  const cluster = store.getters['currentCluster'];

  // Create slide-in panel, if this is the first-time it is being shown
  if (!slideInPanel) {
    const slideInPanelClass = Vue.extend(Panel);

    slideInPanel = new slideInPanelClass();

    // Create a DIV that we can mount the slide-in panel component into
    const div = document.createElement('div');

    div.id = PANEL_ID;
    document.body.appendChild(div);

    slideInPanel.$mount(`#${ PANEL_ID }`);
  }

  // Open the slide-in panel
  slideInPanel.busy = true;
  slideInPanel.typeName = typeName;
  slideInPanel.schema = schema;
  slideInPanel.$t = store.getters['i18n/t'];

  setTimeout(() => {
    slideInPanel.open(typeName);

    // Fetch the open API data for the cluster
    openAPI.get(cluster?.id, store.dispatch).then((data) => {
      slideInPanel.update( { data, schema });
    }).catch((e) => {
      slideInPanel.update({ error: e });
    });
  }, 0);
}
