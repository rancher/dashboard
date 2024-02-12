<script>
import { isMac } from '@shell/utils/platform';

export default {
  data() {
    return { searchShortcut: isMac ? '(\u2318-K)' : '(Ctrl+K)' };
  },

  methods: {
    openSearch() {
      this.$modal.show('searchModal');
    },

    hideSearch() {
      this.$modal.hide('searchModal');
    },
  }
};
</script>

<template>
  <button
    v-clean-tooltip="t('nav.resourceSearch.toolTip', {key: searchShortcut})"
    v-shortkey="{windows: ['ctrl', 'k'], mac: ['meta', 'k']}"
    type="button"
    class="btn header-btn role-tertiary"
    @shortkey="openSearch()"
    @click="openSearch()"
  >
    <i class="icon icon-search icon-lg" />
    <modal
      class="search-modal"
      name="searchModal"
      width="50%"
      height="auto"
    >
      <Jump @closeSearch="hideSearch()" />
    </modal>
  </button>
</template>
