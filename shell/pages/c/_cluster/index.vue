<script>
import { NAME as EXPLORER } from '@shell/config/product/explorer';

export default {
  layout: 'plain',

  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product',
      params: {
        ...route.params,
        product: EXPLORER,
      }
    });
  }
};
</script>
