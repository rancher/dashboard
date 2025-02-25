<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { resourceNames } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import { mapGetters, mapState } from 'vuex';
import { getVendor } from '@shell/config/private-label';

export default {
  name: 'PromptRemoveFleetWorkspacesDialog',

  emits: ['errors'],

  components: { Banner },

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
      vendor: getVendor(),
      errors: []
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),
  },

  methods: {
    resourceNames,
    async remove(buttonDone) {
      try {
        await Promise.all(this.value.map((resource) => resource.remove()));

        this.close(buttonDone);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }

  }
};
</script>

<template>
  <div class="mt-10">
    <div class="mb-20">
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-clean-html="resourceNames(names, t)"
        class="description"
      />
    </div>
    <div class="body">
      <Banner
        color="warning"
        class="warning"
      >
        <span v-clean-html="t('fleet.workspaces.remove.warning1', {}, true)" />
      </Banner>
      <Banner
        color="warning"
        class="warning"
      >
        <span v-clean-html="t('fleet.workspaces.remove.warning2', { vendor }, true)" />
      </Banner>
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
  .description {
    font-weight: 600;
  }

  .body {
    display: flex;
    flex-direction: column;
  }

  .banner {
    margin: 5px;
  }
</style>
