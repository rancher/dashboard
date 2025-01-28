<script>
import IconMessage from '@shell/components/IconMessage.vue';
import { MANAGEMENT } from '@shell/config/types';
import { UIEXTENSION } from '@shell/store/features';

export default {
  props: {
    hasFeatureFlag: {
      type:     Boolean,
      required: true
    }
  },

  components: { IconMessage },

  data() {
    return {
      UIEXTENSION,
      loading:            true,
      showFeaturesButton: false,
    };
  },

  created() {
    if ( !this.hasFeatureFlag && this.$store.getters['management/schemaFor'](MANAGEMENT.FEATURE) ) {
      this.showFeaturesButton = true;
    }

    this.loading = false;
  },

  methods: {
    redirectToFeatureFlags() {
      this.$router.push({
        path:   '/c/local/settings/management.cattle.io.feature',
        params: {
          product:  'settings',
          resource: 'management.cattle.io.feature',
          cluster:  'local',
        }
      });
    }
  }
};
</script>

<template>
  <div data-testid="extension-feature-enable-container">
    <IconMessage
      :vertical="true"
      :subtle="false"
      icon="icon-gear"
    >
      <template v-slot:message>
        <h2>
          {{ t('plugins.setup.title') }}
        </h2>
        <div v-if="!loading">
          <div>
            <div v-clean-html="t('plugins.setup.prompt.can', { ff: UIEXTENSION }, true)" />
            <button
              v-if="showFeaturesButton"
              class="btn role-primary enable-plugin-support"
              data-testid="extension-feature-button"
              role="button"
              :aria-label="t('plugins.setup.install.featuresButton')"
              @click="redirectToFeatureFlags"
            >
              {{ t('plugins.setup.install.featuresButton') }}
            </button>
          </div>
        </div>
      </template>
    </IconMessage>
  </div>
</template>

<style lang="scss" scoped>
  .enable-plugin-support {
    font-size: 14px;
    margin-top: 20px;
  }
</style>
