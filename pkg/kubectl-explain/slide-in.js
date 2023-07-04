import Vue from 'vue';

import Panel from './SlideInPanel';

let component;

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
      component.update( { data: openAPIData, schema });
    }).catch((e) => {
      openAPIData = undefined;
      component.update({ error: e });
    });
  } else {
    component.update({ data: openAPIData, schema });
  }
}

/**
 * Show the explain panel
 */
export async function explain(store, route) {
  // Get params
  cluster = store.getters['currentCluster'];
  const typeName = route.params?.resource;
  const schema = typeName ? store.getters[`cluster/schemaFor`](typeName) : undefined;

  if (!component) {
    component = new Vue(Panel, {
      props: {
        $dispatch: store.dispatch,
        typeName,
        schema,
        busy:      true,
      }
    });

    const div = document.createElement('div');

    div.id = 'kubectl-explain';
    document.body.appendChild(div);

    component.$mount('#kubectl-explain');

    component.typeName = typeName;
    component.schema = schema;

    setTimeout(() => component.open(typeName), 0);
  } else {
    component.busy = true;
    component.typeName = typeName;
    component.schema = schema;
    component.open(typeName);
  }

  loadOpenAPIData(store, schema);
}
