<script>
import { Banner } from '@components/Banner';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { mapGetters, mapState } from 'vuex';
import { isEmpty } from 'lodash';

export default {
  name: 'PromptRemovePodDialog',

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

    plusMore() {
      const count = this.names.length - this.names.length;

      return this.t('promptRemove.andOthers', { count });
    },

    podNames() {
      return this.names.reduce((res, name, i) => {
        if (i >= 5) {
          return res;
        }
        res += `<b>${ name }</b>`;
        if (i === this.names.length - 1) {
          res += this.plusMore;
        } else {
          res += i === this.toRemove.length - 2 ? ' and ' : ', ';
        }

        return res;
      }, '');
    },
  },

  methods: {
    async remove(confirm) {
      const parentComponent = this.$parent.$parent.$parent;

      let goTo;

      if (parentComponent.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...parentComponent.doneLocation };
      }

      try {
        await Promise.all(this.value.map(resource => this.removePod(resource)));
        if ( goTo && !isEmpty(goTo) ) {
          parentComponent.currentRouter.push(goTo);
        }
        parentComponent.close();
      } catch (err) {
        parentComponent.error = err;
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
        class="machine-name"
        v-html="podNames"
      />
    </div>
    <div class="mb-30">
      <Checkbox
        v-model="forceDelete"
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
  .actions {
    text-align: right;
  }

  .machine-name {
    font-weight: 600;
  }
</style>
