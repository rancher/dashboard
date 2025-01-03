<script>
import { mapGetters } from 'vuex';
import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';

export default {
  props: {
    /**
     * Include can be 'full', 'vendor-only' or false
     *   'full': Show's the entire breadcrumb include vendor, product and cluster
     *   'vendor-only': Show only the vendor name in the breadcrumb i.e. 'Rancher > "child"'
     *   false: Don't include any part of the breadcrumb
     */
    breadcrumb: {
      type:    [String, Boolean],
      default: 'full',
      validator(value) {
        return ['full', 'vendor-only'].includes(value) || value === false;
      }
    },
    includeVendor: {
      type:    Boolean,
      default: true
    },
    showChild: {
      type:    Boolean,
      default: true
    }
  },
  computed: { ...mapGetters(['isExplorer', 'currentCluster', 'currentProduct']) },

  methods: {
    // This isn't a computed prop because it would trigger a recompute when the $slots changed
    computeTitle() {
      if (!this.$slots.default || (typeof this.$slots.default()[0].children) !== 'string') {
        console.error('The <TabTitle> component only supports text as the child.'); // eslint-disable-line no-console

        return [];
      }

      const breadcrumb = [this.$slots.default()[0].children.trim()];

      if (this.breadcrumb === 'full') {
        if (this.currentCluster && (this.isExplorer || this.currentCluster.isHarvester ) ) {
          breadcrumb.unshift(this.currentCluster.nameDisplay);
        } else if (this.currentProduct?.name) {
          const productName = this.$store.getters['i18n/withFallback'](`product.${ this.currentProduct.name }`, null, null);

          if (productName) {
            breadcrumb.unshift(productName);
          }
        }
      }

      if (this.includeVendor && ['full', 'vendor-only'].includes(this.breadcrumb)) {
        breadcrumb.unshift(getVendor());
      }

      return breadcrumb;
    },
    updatePageTitle() {
      updatePageTitle(...this.computeTitle());
    }
  },

  created() {
    this.updatePageTitle();
  },

  // Using the render function instead of <template> because <template><slot /></template> will yield a compiler error since
  // <slot /> is not allowed to be a root node of a <template> and I don't want to wrap the child to avoid affecting existing styling
  render() {
    this.updatePageTitle();

    return this.showChild ? this.$slots.default() : null;
  }
};
</script>
