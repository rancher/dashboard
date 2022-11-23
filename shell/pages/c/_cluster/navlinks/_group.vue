<script>
import { UI } from '@shell/config/types';
import { filterBy } from '@shell/utils/array';
import SelectIconGrid from '@shell/components/SelectIconGrid';

export default {
  components: { SelectIconGrid },

  computed: {
    groupSlug() {
      return this.$route.params.group;
    },

    entries() {
      const all = this.$store.getters['cluster/all'](UI.NAV_LINK);

      return filterBy(all, 'normalizedGroup', this.groupSlug);
    },

    groupName() {
      return this.entries[0]?.spec?.group || this.groupSlug;
    }
  },
};
</script>

<template>
  <div>
    <h1>{{ groupName }}</h1>
    <SelectIconGrid
      :rows="entries"
      name-field="labelDisplay"
      description-field="spec.description"
      key-field="_key"
      icon-field="spec.iconSrc"
      side-label-field="spec.sideLabel"
      :as-link="true"
      target-field="actualTarget"
      :color-for="() => 'color1'"
    />
  </div>
</template>
