<script>
import debounce from 'lodash/debounce';
import Group from '@shell/components/nav/Group';
import { isMac } from '@shell/utils/platform';
import { BOTH, TYPE_MODES } from '@shell/store/type-map';
import { COUNT } from '@shell/config/types';

export default {
  emits: ['close'],

  components: { Group },

  data() {
    return {
      isMac,
      value:  '',
      groups: null,
    };
  },

  watch: {
    value() {
      this.queueUpdate();
    },
  },

  mounted() {
    this.updateMatches();
    this.queueUpdate = debounce(this.updateMatches, 250);

    this.$refs.input.focus();
  },

  methods: {
    updateMatches() {
      const clusterId = this.$store.getters['clusterId'];
      const productId = this.$store.getters['productId'];
      const product = this.$store.getters['currentProduct'];

      const allTypesByMode = this.$store.getters['type-map/allTypes'](productId, [TYPE_MODES.ALL]) || {};
      const allTypes = allTypesByMode[TYPE_MODES.ALL];
      const out = this.$store.getters['type-map/getTree'](productId, TYPE_MODES.ALL, allTypes, clusterId, BOTH, null, this.value);

      // Supplement the output with count info. Usually the `Type` component would handle this individually... but scales real bad so give it
      // some help
      const counts = this.$store.getters[`${ product.inStore }/all`](COUNT)?.[0]?.counts || {};

      out.forEach((o) => {
        o.children = o.children?.reduce((res, t) => {
          if (!this.$store.getters[`${ product.inStore }/canList`](t.name)) {
            return res;
          }

          const count = counts[t.name];

          t.count = count ? count.summary.count || 0 : null;
          t.byNamespace = count ? count.namespaces : {};
          t.revision = count ? count.revision : null;

          res.push(t);

          return res;
        }, []);
      });

      this.groups = out;

      // Hide top-level groups with no children (or one child that is an overview)
      this.groups.forEach((g) => {
        const isRoot = g.isRoot || g.name === 'Root';
        const hidden = isRoot || g.children?.length === 0 || (g.children?.length === 1 && g.children[0].overview);

        g.hidden = !!hidden;
      });
    }
  },
};
</script>

<template>
  <div>
    <p
      id="describe-filter-resource-search"
      hidden
    >
      {{ t('nav.resourceSearch.filteringDescription') }}
    </p>
    <div class="dialog-title">
      <div>{{ t('nav.resourceSearch.label') }}</div>
      <p>{{ t('nav.resourceSearch.prompt') }}</p>
    </div>
    <div class="search-box">
      <input
        ref="input"
        v-model="value"
        :placeholder="t('nav.resourceSearch.placeholder')"
        class="search"
        role="textbox"
        :aria-label="t('nav.resourceSearch.label')"
        aria-describedby="describe-filter-resource-search"
        @keyup.esc="$emit('close')"
      >
    </div>
    <div class="results">
      <div
        v-for="g in groups"
        :key="g.name"
        class="package"
      >
        <Group
          v-if="!g.hidden"
          :key="g.name"
          id-prefix=""
          :group="g"
          :can-collapse="false"
          :fixed-open="true"
          :highlight-route="false"
          @close="$emit('close')"
        >
          <template #accordion>
            <h6>{{ g.label }}</h6>
          </template>
        </Group>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .search, .search:hover {
    position: relative;
    background-color: var(--dropdown-bg);
    border-radius: 0;
    box-shadow: none;
  }

  .search-box {
    margin: 8px;
  }

  .search:focus-visible {
    outline-offset: -2px;
  }

  .dialog-title {
    padding: 8px;

    > div {
      font-size: 16px;
      font-weight: bold;
      margin: 8px 0;
    }
  }

  .results {
    margin-top: -1px;
    overflow-y: auto;
    padding: 10px;
    color: var(--dropdown-text);
    background-color: var(--dropdown-bg);
    border-top: 1px solid var(--dropdown-border);
    height: 75vh;
  }
</style>
