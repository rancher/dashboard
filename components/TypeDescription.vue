<script>
import Banner from '@/components/Banner';
import { mapGetters } from 'vuex';
import { HIDE_DESC, mapPref } from '@/store/prefs';
import { addObject } from '@/utils/array';

export default {
  components: { Banner },

  props:      {
    resource: {
      type:     String,
      required: true
    },
  },

  computed: {
    ...mapGetters(['isExplorer']),

    hideDescriptions: mapPref(HIDE_DESC),

    typeDescriptionKey() {
      const key = `typeDescription."${ this.resource }"`;

      if ( this.hideDescriptions.includes(this.resource) || this.hideDescriptions.includes('ALL') ) {
        return false;
      }

      if ( this.$store.getters['i18n/exists'](key) ) {
        return key;
      }

      return false;
    },
  },

  methods: {
    hideTypeDescription() {
      const neu = this.hideDescriptions.slice();

      addObject(neu, this.resource);

      this.hideDescriptions = neu;
    },
  },
};
</script>

<template>
  <Banner
    v-if="typeDescriptionKey"
    class="type-banner mb-20 mt-0"
    color="info"
    :closable="true"
    :label-key="typeDescriptionKey"
    @close="hideTypeDescription"
  />
</template>
