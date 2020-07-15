import { DSL } from '@/store/type-map';

export const NAME = 'mcm';

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

  if ( store.getters['isRancher'] ) {
    product({
      removable: false,
      externalLink
    });
  }
}
