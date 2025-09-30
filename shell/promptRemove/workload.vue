<script>
import { resourceNames } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import ButtonDropdown from '@shell/components/ButtonDropdown';
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'PromptRemoveWorkloadDialog',

  emits: ['errors'],

  components: { Banner, ButtonDropdown },

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
  },

  data() {
    return {
      errors:            [],
      propagationPolicy: 'Orphan'
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),
    propagationPolicyOptions() {
      return ['Orphan', 'Foreground', 'Background'];
    }
  },

  methods: {
    resourceNames,
    async remove(confirm) {
      try {
        await Promise.all(this.value.map((resource) => resource.remove({ params: { propagationPolicy: this.propagationPolicy } })));
        this.close();
      } catch (err) {
        this.$emit('errors', err);
        confirm(false);
      }
    }
  }
};
</script>

<template>
  <div class="mt-10">
    <div class="mb-30">
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-clean-html="resourceNames(names, null, t)"
        class="body"
      />
    </div>
    <div class="my-5">
      <label>
        {{ t('promptRemove.propagationPolicyLabel') }}
      </label>
      <div class="mb-10" />
    </div>
    <ButtonDropdown
      v-model="propagationPolicy"
      :dropdown-options="propagationPolicyOptions"
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
