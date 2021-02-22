<script>
import { NAME as SETTINGS } from '@/config/product/settings';
import { MANAGEMENT } from '@/config/types';

export default {
  layout: 'plain',

  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  SETTINGS,
        resource: MANAGEMENT.SETTING,
      }
    });
  }
};
</script>
