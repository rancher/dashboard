<script>
import { NAME as SETTINGS } from '@shell/config/product/settings';
import { MANAGEMENT } from '@shell/config/types';

export default {
  beforeCreate() {
    const hasSettings = !!this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

    return this.$router.replace({
      name:   'c-cluster-product-resource',
      params: {
        ...this.$route.params,
        product:  SETTINGS,
        // Will have one or t'other
        resource: hasSettings ? MANAGEMENT.SETTING : MANAGEMENT.FEATURE,
      }
    });
  }
};
</script>
