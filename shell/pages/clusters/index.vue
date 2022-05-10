<script>
import { NAME as MANAGER } from '@shell/config/product/manager';

export default {
  fetch({ store, redirect }) {
    const id = store.getters['defaultClusterId'];

    if ( id ) {
      redirect({ name: 'c-cluster', params: { cluster: id } });
    } else {
      redirect({
        name:   'c-cluster-product',
        params: {
          cluster: 'local',
          product: MANAGER
        }
      });
    }
  }
};
</script>
