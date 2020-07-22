import { DSL } from '@/store/type-map';

export const NAME = 'ecm';

export function init(store) {
  const { product } = DSL(store, NAME);

  const cluster = store.getters['currentCluster'];
  let externalLink = '/g';

  if ( cluster ) {
    externalLink = `/c/${ escape(cluster.id) }`;
  }

  if ( process.env.dev ) {
    externalLink = `https://localhost:8000${ externalLink }`;
  }

  product({
    ifGetter:  'isMultiCluster',
    removable: false,
    externalLink,
  });
}
