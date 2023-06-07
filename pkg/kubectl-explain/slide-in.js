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
      console.error('LOADED API DATA');
      openAPIData = response.data || response;
      console.log(response);
      component.update( { data: openAPIData, schema });
    }).catch((e) => {
      openAPIData = undefined;
      component.update({ error: e });
    });
  } else {
    component.update({ data: openAPIData, schema });
  }

  // console.error('Load OPEN API DATA');

  // const sleep = ms => new Promise(r => setTimeout(r, ms));

  // sleep(5000).then(() => { component.busy = false; });

  // console.log(schema);
}

export async function install(store, route) {
  console.log('hello');
  console.log('store');
  console.log(route);

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
        busy: true,
      }
    });

    console.error('OPEN');
    console.log(schema);
    console.log(typeName);

    var div = document.createElement('div');
    div.id = 'kubectl-explain';
    document.body.appendChild(div);

    console.log(component);

    component.$mount('#kubectl-explain');

    component.typeName = typeName;
    component.schema = schema;

    setTimeout(() => component.open(typeName), 0);
  } else {
    console.log(component);

    component.busy = true;
    component.typeName = typeName;
    component.schema = schema;
    component.open(typeName);
  }

  loadOpenAPIData(store, schema);
}
