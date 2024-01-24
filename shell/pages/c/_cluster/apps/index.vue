<script>
import { NAME as APPS } from '@shell/config/product/apps';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-apps-charts',
      params: {
        ...route.params,
        product: APPS,
      }
    });
  }
};
</script>
