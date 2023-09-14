import Vue from 'vue';

import Panel from './SlideInPanel';

const PANEL_ID = 'kubectl-explain';

// Slide in panel component
let slideInPanel;

let openAPIData;
let cluster;

function loadOpenAPIData(store, schema) {
  // Have we got cached API data?
  if (!openAPIData) {
    store.dispatch(
      `cluster/request`,
      { url: `/k8s/clusters/${ cluster.id }/openapi/v2?timeout=32s` }
    ).then((response) => {
      openAPIData = response.data || response;
      slideInPanel.update( { data: openAPIData, schema });
    }).catch((e) => {
      openAPIData = undefined;
      slideInPanel.update({ error: e });
    });
  } else {
    slideInPanel.update({ data: openAPIData, schema });
  }
}

/**
 * Show the slide-in panel with the resource explanation
 */
export async function explain(store, route) {
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;

  cluster = store.getters['currentCluster'];

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

    loadOpenAPIData(store, schema);
  }, 0);
}
