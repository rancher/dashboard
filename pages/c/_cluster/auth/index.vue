<script>
import { NAME as AUTH } from '@/config/product/auth';
import { MANAGEMENT } from '@/config/types';

export default {
  layout: 'plain',

  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  AUTH,
        resource: MANAGEMENT.USER,
      }
    });
  }
};
</script>
