<script>
import debounce from 'lodash/debounce';
import Group from '@/components/nav/Group';
import { isMac } from '@/utils/platform';
import { BOTH, ALL } from '@/store/type-map';

export default {
  components: { Group },

  data() {
    return {
      isMac,
      value:       '',
      groups:      null,
      isFocused:   false,
      blurTimer:   null,
    };
  },

  computed: {
    placeholder() {
      if ( this.isFocused ) {
        return 'Type to search...';
      } else if ( isMac ) {
        return 'Jump to... (\u2318-K)';
      } else {
        return 'Jump to... (Ctrl+K)';
      }
    },
  },

  watch: {
    value() {
      this.queueUpdate();
    },
  },

  mounted() {
    this.updateMatches();
    this.queueUpdate = debounce(this.updateMatches, 250);
  },

  methods: {
    focused() {
      this.show();
    },

    blurred() {
      clearTimeout(this.blurTimer);
      this.blurTimer = setTimeout(() => {
        this.hide();
      }, 200);
    },

    hotkey() {
      this.$refs.input.focus();
      this.$refs.input.select();
    },

    show() {
      this.isFocused = true;
      clearTimeout(this.blurTimer);
    },

    hide() {
      this.isFocused = false;
      this.value = '';
    },

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
    },
  },
};
</script>

<template>
  <div>
    <input
      ref="input"
      v-model="value"
      :placeholder="placeholder"
      class="search"
      @focus="focused"
      @blur="blurred"
      @keyup.esc="hide"
    />
    <div v-if="isFocused" class="results">
      <div v-for="g in groups" :key="g.name" class="package">
        <Group
          :key="g.name"
          id-prefix=""
          :group="g"
          :can-collapse="false"
          :expanded="true"
        >
          <template slot="accordion">
            <h6>{{ g.label }}</h6>
          </template>
        </Group>
      </div>
    </div>
    <button v-shortkey="{windows: ['ctrl', 'k'], mac: ['meta', 'k']}" class="hide" @shortkey="hotkey()" />
  </div>
</template>

<style lang="scss" scoped>
  .search {
    position: relative;
  }

  .results {
    position: absolute;
    top: 45px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    overflow-y: auto;
    z-index: 1;
    padding: 0 10px;
    color: var(--dropdown-text);
    background-color: var(--dropdown-bg);
    border: 1px solid var(--dropdown-border);
    border-radius: 0 0 5px 5px;
    box-shadow: 0 5px 20px var(--shadow);
  }
</style>
