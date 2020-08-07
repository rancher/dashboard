<script>
import { NAME as APPS } from '@/config/product/apps';

export default {
  layout: 'plain',

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
