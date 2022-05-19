<script>
import debounce from 'lodash/debounce';
import Group from '@shell/components/nav/Group';
import { isMac } from '@shell/utils/platform';
import { BOTH, ALL } from '@shell/store/type-map';

export default {
  components: { Group },

  data() {
    return {
      isMac,
      value:       '',
      groups:      null,
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
      const isAllNamespaces = this.$store.getters['isAllNamespaces'];
      const product = this.$store.getters['productId'];

      let namespaces = null;

      if ( !isAllNamespaces ) {
        namespaces = Object.keys(this.$store.getters['namespaces']());
      }

      const allTypes = this.$store.getters['type-map/allTypes'](product) || {};
      const out = this.$store.getters['type-map/getTree'](product, ALL, allTypes, clusterId, BOTH, namespaces, null, this.value);

      this.groups = out;

      // Hide top-level groups with no children (or one child that is an overview)
      this.groups.forEach((g) => {
        const isRoot = g.isRoot || g.name === 'Root';
        const hidden = isRoot || g.children?.length === 0 || (g.children?.length === 1 && g.children[0].overview);

        g.hidden = !!hidden;
      });
    },
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
      @keyup.esc="$emit('closeSearch')"
    />
    <div class="results">
      <div v-for="g in groups" :key="g.name" class="package">
        <Group
          v-if="!g.hidden"
          :key="g.name"
          id-prefix=""
          :group="g"
          :can-collapse="false"
          :fixed-open="true"
          @close="$emit('closeSearch')"
        >
          <template slot="accordion">
            <h6>{{ g.label }}</h6>
          </template>
        </Group>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .search, .search:hover, search:focus {
    position: relative;
    background-color: var(--dropdown-bg);
    border-radius: 0;
    box-shadow: none;
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
