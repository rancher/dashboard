import { DSL } from '@/store/type-map';

export const NAME = 'ecm';

export function init(store) {
  const { product } = DSL(store, NAME);

  const cluster = store.getters['currentCluster'];
  let link = '/g';

  if ( cluster ) {
    link = `/c/${ escape(cluster.id) }`;
  }

  if ( process.env.dev ) {
    link = `https://localhost:8000${ link }`;
  }

  product({
    ifGetter:  'isMultiCluster',
    icon:      'cluster',
    removable: false,
    weight:    3,
    link,
  });
}
