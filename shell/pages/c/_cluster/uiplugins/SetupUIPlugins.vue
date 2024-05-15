<script>
import IconMessage from '@shell/components/IconMessage.vue';
import { MANAGEMENT } from '@shell/config/types';

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
            <p>
              {{ t('plugins.setup.prompt.can') }}
            </p>
            <button
              v-if="showFeaturesButton"
              class="btn role-primary enable-plugin-support"
              data-testid="extension-feature-button"
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
