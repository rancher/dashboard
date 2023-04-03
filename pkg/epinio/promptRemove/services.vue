<script>
import { resourceNames } from '@shell/utils/string';
import { mapGetters, mapState } from 'vuex';

export default {
  name:  'ServicesPromptRemove',
  props: {
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    names: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    type: {
      type:     String,
      required: true
    }
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),

    plusMore() {
      const remaining = this.toRemove.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },

    bounded() {
      return this.value?.reduce((acc, svc) => {
        const apps = svc?.boundapps ?? [];

        return [...acc, ...apps];
      }, []) || [];
    },
  },

  methods: { resourceNames }
};
</script>

<template>
  <div>
    <template>
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-html="resourceNames(names, plusMore, t)"
      />
    </template>
    <div
      v-if="!bounded.length"
      class="text info mb-10 mt-20"
    >
      <span>
        {{ t('epinio.services.applicationsNotBound') }}
      </span>
      <i class="icon icon-checkmark" />
    </div>
    <div
      v-if="bounded.length"
      class="text-warning mb-10 mt-20"
    >
      {{ t('epinio.services.applicationsBound', { count: bounded.length }) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.text.info {
  display: flex;
  align-items: center;

  > span {
    margin-right: 5px;
  }
}
</style>
