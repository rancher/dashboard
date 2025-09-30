<script>
import { resourceNames } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { mapGetters, mapState } from 'vuex';
import { isEmpty } from 'lodash';

export default {
  name: 'PromptRemoveWorkloadDialog',

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
      <select
        v-model="propagationPolicy"
        class="propagation-policy-select"
      >
        <option value="Foreground">
          Foreground
        </option>
        <option value="Background">
          Background
        </option>
        <option value="Orphan">
          Orphan
        </option>
      </select>
      <div class="mt-10" />
      <div>
        <div v-if="propagationPolicy === 'Foreground'">
          Foreground: Deletes dependents before removing the current resource.
        </div>
        <div v-else-if="propagationPolicy === 'Background'">
          Background: Deletes the current resource immediately and dependents in the background.
        </div>
        <div v-else-if="propagationPolicy === 'Orphan'">
          Orphan: Removes the current resource but leaves dependents orphaned.
        </div>
      </div>
    </div>
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
