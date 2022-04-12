<script>
import { NAME as SETTINGS } from '@shell/config/product/settings';
import { MANAGEMENT } from '@shell/config/types';

export default {
  layout: 'plain',

  middleware({ redirect, route, store } ) {
    const hasSettings = !!store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  SETTINGS,
        // Will have one or t'other
        resource: hasSettings ? MANAGEMENT.SETTING : MANAGEMENT.FEATURE,
      }
    });
  }
};
</script>
