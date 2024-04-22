<script>
import { mapGetters } from 'vuex';
import { CLUSTER_BADGE } from '@shell/config/labels-annotations';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import ClusterBadge from '@shell/components/ClusterBadge';
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import ColorInput from '@shell/components/form/ColorInput';
import { parseColor, textColor } from '@shell/utils/color';
import { NORMAN } from '@shell/config/types';
import { abbreviateClusterName } from '@shell/utils/cluster';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import ClusterIconMenu from '@shell/components/ClusterIconMenu';

export default {
  name:       'AddCustomBadgeDialog',
  components: {
    Card,
    AsyncButton,
    Banner,
    Checkbox,
    LabeledInput,
    ColorInput,
    ClusterBadge,
    ClusterIconMenu,
    ClusterProviderIcon,
  },
  props: {
    isCreate:    { type: Boolean, default: false },
    clusterName: { type: String, default: '' },
    mode:        { type: String, default: _CREATE },
  },
  data() {
    return {
      useCustomComment: null,
      errors:           [],
      badgeBgColor:     '',
      badgeComment:     '',
      badgeAsIcon:      null,
      badgeColorPicker: false,
      letter:           '',
      cluster:          {},
    };
  },
  mounted() {
    // Generates a fake cluster object for use with badge component on cluster provisioning.
    if (this.isCreating) {
      this.cluster = this.getPreviewCluster;
      this.badgeAsIcon = this.cluster?.badge?.iconText?.length > 0 || false;
      this.letter = this.cluster?.badge?.iconText || abbreviateClusterName(this.clusterName);
      this.useCustomComment = this.cluster?.badge?.text?.length > 0 || false;
      this.badgeBgColor = this.cluster?.badge?.color || 'transparent';
      this.badgeComment = this.cluster?.badge?.text || null;
      this.badgeColorPicker = this.badgeBgColor !== 'transparent';
    }
  },

  async fetch() {
    if (this.isCreating ) {
      return;
    }

    await this.$store.dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.currentCluster.id });

    if (this.currentCluster.metadata?.annotations) {
      this.badgeComment = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.TEXT];
      this.useCustomComment = this.badgeComment?.length > 0;
      this.badgeBgColor = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.COLOR] || 'transparent';
      this.badgeAsIcon = !!this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || false;
      this.badgeColorPicker = this.badgeBgColor !== 'transparent';

      // TODO: Hardcode the annotations for creating cluster
      this.letter = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || abbreviateClusterName(this.currentCluster.nameDisplay);
    }
  },
  watch: {
    // INFO: If the user has a custom comment, set the badge text
    useCustomComment: {
      handler(neu, old) {
        if (neu !== old) {
          this.badgeComment = neu ? this.badgeComment : '';
        }
      },
      immediate: true,
    },
    badgeColorPicker: {
      handler() {
        this.badgeBgColor = this.badgeColorPicker ? this.badgeBgColor : 'transparent';
      },
      immediate: true,
    },
    badgeAsIcon: {
      handler(neu, old) {
        if (neu !== old) {
          this.letter = neu ? this.letter : abbreviateClusterName(this.clusterName);
        }
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters('customisation', ['getPreviewCluster']),
    isCreating() {
      return this.isCreate;
    },
    showPreview() {
      return this.badgeAsIcon;
    },
    canSubmit() {
      if (this.mode === _CREATE) {
        return this.badgeAsIcon || this.useCustomComment;
      }

      if (this.badgeAsIcon && this.useCustomComment) {
        return true;
      } else {
        if (this.mode === _EDIT) {
          return true;
        }

        return this.badgeAsIcon !== this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || this.useCustomComment !== !!this.currentCluster.metadata?.annotations[CLUSTER_BADGE.TEXT];
      }
    },
    // Fake cluster object for use with badge component
    previewCluster() {
      // Make cluster object that is enough for the badge component to work
      console.log(this.currentCluster);

      return (!this.isCreate && this.currentCluster) ? {
        isLocal:         this.currentCluster.isLocal,
        providerNavLogo: this.currentCluster.providerNavLogo,
        ready:           this.currentCluster.ready ?? true,
        badge:           {
          text:      this.badgeComment,
          color:     this.badgeBgColor,
          textColor: textColor(parseColor(this.badgeBgColor)),
          iconText:  this.badgeAsIcon ? this.letter.toUpperCase() : '',
        }
      } : {
        isLocal:         false,
        ready:           true,
        providerNavLogo: '',
        badge:           {
          text:      this.badgeComment,
          color:     this.badgeBgColor,
          textColor: textColor(parseColor(this.badgeBgColor || 'white')),
          iconText:  this.badgeAsIcon ? this.letter.toUpperCase() : '',
        }
      };
    },

    previewName() {
      if (this.isCreating) {
        return this.clusterName;
      }

      return this.currentCluster.nameDisplay;
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        if (!this.isCreate) {
          // Fetch the Norman cluster object
          const norman = await this.$store.dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.currentCluster.id });

          delete norman.annotations[CLUSTER_BADGE.COLOR];
          delete norman.annotations[CLUSTER_BADGE.ICON_TEXT];
          delete norman.annotations[CLUSTER_BADGE.TEXT];

          this.$set(norman.annotations, CLUSTER_BADGE.COLOR, this.badgeColorPicker ? this.badgeBgColor : 'transparent');
          this.$set(norman.annotations, CLUSTER_BADGE.ICON_TEXT, this.letter.toUpperCase());
          this.$set(norman.annotations, CLUSTER_BADGE.TEXT, this.badgeComment);

          await norman.save();

          buttonDone(true);
          this.close();
        } else {
          this.$store.commit('customisation/setPreviewCluster', { ...this.previewCluster });

          buttonDone(true);
          this.close();
        }
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Card
    class="prompt-badge"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      class="text-default-text"
    >
      {{ t('clusterBadge.modal.title') }}
    </h4>

    <div
      slot="body"
      class="cluster-badge-body"
    >
      <div>{{ t('clusterBadge.modal.previewTitle') }}</div>
      <div class="badge-preview">
        <div class="badge-preview-sidenav">
          <p> {{ t('clusterBadge.modal.previewSide') }}</p>

          <div>
            <ClusterIconMenu :cluster="previewCluster" />
            <span>{{ clusterName }}</span>
          </div>
        </div>
        <span class="badge-preview-separator" />
        <div class="badge-preview-header">
          <p> {{ t('clusterBadge.modal.previewHeader') }}</p>
          <div
            class="col span-12"
          >
            <ClusterProviderIcon
              v-if="showPreview"
              :cluster="previewCluster"
            />
            <div class="cluster-name">
              {{ previewName }}
            </div>
            <ClusterBadge
              v-if="useCustomComment"
              :cluster="previewCluster"
            />
          </div>
        </div>
      </div>

      <div class="badge-customisation">
        <!-- Badge Abbreviation -->
        <div class="badge-customisation-badge">
          <Checkbox
            v-model="badgeAsIcon"
            :label="t('clusterBadge.modal.badgeAsIcon')"

            :tooltip="t('clusterBadge.modal.maxCharsTooltip')"
          />

          <LabeledInput
            v-model.trim="letter"
            :disabled="!badgeAsIcon"
            class="badge-icon-text"
            :label="t('clusterBadge.modal.iconText')"
            :maxlength="3"
          />
        </div>

        <!-- Comment -->
        <div>
          <Checkbox
            v-model="useCustomComment"
            :label="t('clusterBadge.modal.checkbox')"
          />

          <LabeledInput
            v-model.trim="badgeComment"
            :disabled="!useCustomComment"
            :label="t('clusterBadge.modal.comment')"
            :maxlength="32"
          />
        </div>

        <!-- Color -->
        <div>
          <Checkbox
            v-model="badgeColorPicker"
            :label="t('clusterBadge.modal.badgeBgColor')"
          />
          <ColorInput
            v-model="badgeBgColor"
            :disabled="!badgeColorPicker"
            :default-value="badgeBgColor"
            :label="t('clusterBadge.modal.badgeBgColor')"
          />
        </div>
      </div>
    </div>

    <div
      slot="actions"
      class="bottom"
    >
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
      <div class="buttons">
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          :action-label="t('clusterBadge.modal.buttonAction')"
          :disabled="!canSubmit"
          @click="apply"
        />
      </div>
    </div>
  </Card>
</template>
<style lang='scss' scoped>
.card-container {
  padding: 1rem;
}

.badge-preview {
  display: flex;
  width: 100%;
  gap: 40px;
  padding: 10px 5px;
  margin-bottom: 30px;
  margin-top: 5px;
  background: var(--body-bg);
  border-radius: 5px;

  p {
    font-size: 11px;
    font-weight: light;
    padding: 5px 0;
  }

  &-sidenav {
    display: flex;
    flex-direction: column;

    div {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  &-separator {
    display: flex;
    border-left: 1px solid var(--border);
    width: 2px;
    height: 30px;
    align-self: end;
  }

   &-header {
    display: flex;
    flex-direction: column;

    div {
      display: flex;
      min-height: 32px;
      align-items: center;

      .cluster-badge {
        min-height: auto;
      }
    }
  }
}

.prompt-badge {
  margin: 0;

  .cluster-badge-body {
    min-height: 50px;
    display: flex;
    flex-direction: column;

    .cluster-name {
      margin: 0 10px;
      font-size: 16px;
    }

    .cluster-badge-icon-preview {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      font-weight: bold;
    }

    .cluster-badge-preview {
      cursor: default;
      border-radius: 10px;
      font-size: 12px;
      padding: 2px 10px;
    }

    ::v-deep .badge-icon-text input {
      text-transform: uppercase;
    }
  }
}

.badge-customisation {
  display: flex;
  gap: 10px;

  div {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 10px;

    .color-input {
      padding: 5px 10px;
    }
  }
}

.bottom {
  display: flex;
  flex-direction: column;
  flex: 1;

  .banner {
    margin-top: 0;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
