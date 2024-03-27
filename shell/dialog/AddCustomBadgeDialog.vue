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
      letter:           '',
      cluster:          {},
    };
  },
  mounted() {
    // Generates a fake cluster object for use with badge component on cluster provisioning.
    if (this.enableFields) {
      this.cluster = this.getPreviewCluster;
      this.badgeAsIcon = true;
      this.letter = this.cluster?.badge?.iconText || abbreviateClusterName(this.clusterName);
      this.useCustomComment = this.cluster?.badge?.text?.length > 0 || false;
      this.badgeBgColor = this.cluster?.badge?.color || '#f1f1f1';
      this.badgeComment = this.cluster?.badge?.text || null;
    }
  },

  fetch() {
    if (this.enableFields ) {
      return;
    }

    if (this.currentCluster.metadata?.annotations) {
      this.badgeComment = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.TEXT];
      this.useCustomComment = this.badgeComment?.length > 0;
      this.badgeBgColor = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.COLOR] || '#ff0000';

      this.badgeAsIcon = !!this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || false;

      // TODO: Hardcode the annotations for creating cluster
      this.letter = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || abbreviateClusterName(this.currentCluster.nameDisplay);
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters('customisation', ['getPreviewCluster']),
    enableFields() {
      return this.isCreate || this.mode === _EDIT;
    },
    canSubmit() {
      if (this.mode === _CREATE) {
        return true;
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
      return (!this.isCreate && this.currentCluster) ? {
        isLocal:         this.currentCluster.isLocal,
        providerNavLogo: this.currentCluster.providerNavLogo,
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
      if (this.enableFields) {
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

          if (this.badgeAsIcon) {
            this.$set(norman.annotations, CLUSTER_BADGE.COLOR, this.badgeBgColor);
            this.$set(norman.annotations, CLUSTER_BADGE.ICON_TEXT, this.letter.toUpperCase());
            // If the user has a custom comment, set it as the badge text
            if (this.useCustomComment) {
              this.$set(norman.annotations, CLUSTER_BADGE.TEXT, this.badgeComment);
            }
          }

          await norman.save();

          buttonDone(true);
          this.close();
        } else {
          if (!this.badgeComment) {
            delete this.previewCluster.badge.text;
          }

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
      class="pl-10 pr-10 cluster-badge-body"
    >
      <div>{{ t('clusterBadge.modal.previewTitle') }}</div>

      <div class="mt-10 pl-20 row preview-row">
        <div class="badge-preview col span-12">
          <ClusterProviderIcon
            v-if="isCreate"
            :cluster="previewCluster"
          />
          <ClusterProviderIcon
            v-else
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

      <div class="row mt-10">
        <div class="col">
          <Checkbox
            v-model="badgeAsIcon"
            :label="t('clusterBadge.modal.badgeAsIcon')"
            class="mt-10"
            :tooltip="t('clusterBadge.modal.maxCharsTooltip')"
          />
        </div>
      </div>
      <div class="row mt-10">
        <div class="col">
          <LabeledInput
            v-model.trim="letter"
            :disabled="!badgeAsIcon"
            class="badge-icon-text"
            :label="t('clusterBadge.modal.iconText')"
            :maxlength="3"
          />
        </div>
        <div class="col">
          <ColorInput
            v-model="badgeBgColor"
            :disabled="!badgeAsIcon"
            :default-value="badgeBgColor"
            :label="t('clusterBadge.modal.badgeBgColor')"
          />
        </div>
      </div>

      <div class="row mt-10">
        <div class="col">
          <Checkbox
            v-model="useCustomComment"
            :label="t('clusterBadge.modal.checkbox')"
            class="mt-10"
          />
        </div>
      </div>

      <div class="options">
        <div class="row mt-10">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="badgeComment"
              :disabled="!useCustomComment"
              :label="t('clusterBadge.modal.comment')"
              :maxlength="32"
            />
          </div>
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
.cluster-icon {
  border: 1px solid var(--default-border);
}

.text-default-text {
  margin-bottom: 4px;
}

.prompt-badge {
  margin: 0;

  .cluster-badge-body {
    min-height: 50px;
    display: flex;
    flex-direction: column;

    .preview-row {
      height: 32px;

      .badge-preview {
        align-items: center;
        display: flex;
        height: 32px;
        white-space: nowrap;

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
      }
    }

    ::v-deep .badge-icon-text input {
      text-transform: uppercase;
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
