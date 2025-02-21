<script>
import debounce from 'lodash/debounce';
import Group from '@shell/components/nav/Group';
import { isMac } from '@shell/utils/platform';
import { BOTH, TYPE_MODES } from '@shell/store/type-map';
import { COUNT } from '@shell/config/types';

export default {
  emits: ['closeSearch'],

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

      // Suplement the output with count info. Usualy the `Type` component would handle this individualy... but scales real bad so give it
      // some help
      const counts = this.$store.getters[`${ product.inStore }/all`](COUNT)?.[0]?.counts || {};

      out.forEach((o) => {
        o.children?.forEach((t) => {
          const count = counts[t.name];

          t.count = count ? count.summary.count || 0 : null;
          t.byNamespace = count ? count.namespaces : {};
          t.revision = count ? count.revision : null;
        });
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
    <input
      ref="input"
      v-model="value"
      :placeholder="t('nav.resourceSearch.placeholder')"
      class="search"
      role="textbox"
      :aria-label="t('nav.resourceSearch.label')"
      @keyup.esc="$emit('closeSearch')"
    >
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
          @close="$emit('closeSearch')"
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

  .search:focus-visible {
    outline-offset: -2px;
  }

  .results {
    margin-top: -1px;
    overflow-y: auto;
    padding: 10px;
    color: var(--dropdown-text);
    background-color: var(--dropdown-bg);
    border: 1px solid var(--dropdown-border);
    height: 75vh;
  }
</style>
