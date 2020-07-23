<script>
import { NAME as APPS } from '@/config/product/apps';
import { CATALOG } from '@/config/types';

export default {
  layout: 'plain',

  async middleware({ redirect, route, store } ) {
    const releases = await store.dispatch('cluster/findAll', { type: CATALOG.RELEASE });
    let name = 'c-cluster-product-resource';

    if ( !releases.length ) {
      name = 'c-cluster-product-resource-create';
    }

    return redirect({
      name,
      params: {
        ...route.params,
        product:  APPS,
        resource: CATALOG.RELEASE,
      }
    });
  }
};
</script>
