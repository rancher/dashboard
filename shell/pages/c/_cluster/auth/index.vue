<script>
import { NAME as AUTH } from '@shell/config/product/auth';
import { MANAGEMENT } from '@shell/config/types';

export default {
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
