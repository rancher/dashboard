<script>
import { resourceNames } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { mapGetters, mapState } from 'vuex';
import { isEmpty } from 'lodash';

export default {
  name: 'PromptRemovePodDialog',

  emits: ['errors'],

  components: {
    Banner,
    Checkbox
  },

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
    },

    close: {
      type:     Function,
      required: true
    },

    doneLocation: {
      type:    Object,
      default: () => {}
    }
  },

  data() {
    return {
      errors:      [],
      forceDelete: false
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),
  },

  methods: {
    resourceNames,
    async remove(confirm) {
      let goTo;

      if (this.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...this.doneLocation };
      }

      try {
        await Promise.all(this.value.map((resource) => this.removePod(resource)));
        if ( goTo && !isEmpty(goTo) ) {
          this.value?.[0]?.currentRouter().push(goTo);
        }
        this.close();
      } catch (err) {
        this.$emit('errors', err);
        confirm(false);
      }
    },

    removePod(pod) {
      const opt = this.forceDelete ? {
        data: {
          gracePeriod: 0,
          force:       true
        }
      } : undefined;

      return pod.remove(opt);
    },
  }
};
</script>

<template>
  <div class="mt-10">
    <div class="mb-30">
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-clean-html="resourceNames(names, t)"
        class="body"
      />
    </div>
    <div class="mb-30">
      <Checkbox
        v-model:value="forceDelete"
        :label="t('promptForceRemove.forceDelete')"
      />
    </div>
    <Banner
      color="warning"
      label-key="promptForceRemove.podRemoveWarning"
    />
    <Banner
      v-for="(error, i) in errors"
      :key="i"
      class=""
      color="error"
      :label="error"
    />
  </div>
</template>

<style lang='scss' scoped>
  .body {
    font-weight: 600;
  }
  .actions {
    text-align: right;
  }
</style>
