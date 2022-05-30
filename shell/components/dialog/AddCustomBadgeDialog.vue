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

  data() {
    return {
      useCustomBadge:   null,
      errors:           [],
      badgeBgColor:     '',
      badgeDescription: '',
      badgeAsIcon:      null,
      letter:           '',
    };
  },

  fetch() {
    if (this.currentCluster.metadata?.annotations) {
      this.badgeDescription = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.TEXT];
      this.useCustomBadge = this.badgeDescription?.length > 0;
      this.badgeDescription = this.badgeDescription || 'Example Text';
      this.badgeBgColor = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.COLOR] || '#ff0000';

      this.badgeAsIcon = !!this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || false;

      this.letter = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || this.badgeDescription.substring(0, 2);
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),

    previewColor() {
      return textColor(parseColor(this.badgeBgColor)) || '#ffffff';
    },
    canSubmit() {
      return this.badgeDescription.length >= 1;
    },
    // Fake cluster object for use with badge component
    previewCluster() {
      // Make cluster object that is enough for the badge component to work
      return {
        isLocal:         this.currentCluster.isLocal,
        providerNavLogo: this.currentCluster.providerNavLogo,
        badge:           {
          text:        this.badgeDescription,
          color:       this.badgeBgColor,
          textColor:   textColor(parseColor(this.badgeBgColor)),
          iconText:    this.badgeAsIcon ? this.letter.toUpperCase() : '',
        }
      };
    },

    mode() {
      return !!this.useCustomBadge ? 'edit' : 'view';
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        // Fetch the Norman cluster object
        const norman = await this.$store.dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.currentCluster.id });

        delete norman.annotations[CLUSTER_BADGE.TEXT];
        delete norman.annotations[CLUSTER_BADGE.COLOR];
        delete norman.annotations[CLUSTER_BADGE.ICON_TEXT];

        if (this.useCustomBadge) {
          this.$set(norman.annotations, CLUSTER_BADGE.TEXT, this.badgeDescription);
          this.$set(norman.annotations, CLUSTER_BADGE.COLOR, this.badgeBgColor);
          if (this.badgeAsIcon) {
            this.$set(norman.annotations, CLUSTER_BADGE.ICON_TEXT, this.letter.toUpperCase());
          }
        }

        await norman.save();

        buttonDone(true);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Card class="prompt-badge" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text">
      {{ t('clusterBadge.modal.title') }}
    </h4>

    <div slot="body" class="pl-10 pr-10 cluster-badge-body">
      <div>{{ t('clusterBadge.modal.previewTitle') }}</div>

      <div class="mt-10 pl-20 row preview-row">
        <div class="badge-preview col span-12">
          <ClusterProviderIcon v-if="useCustomBadge" :cluster="previewCluster" />
          <ClusterProviderIcon v-else :cluster="currentCluster" />
          <div class="cluster-name">
            {{ currentCluster.nameDisplay }}
          </div>
          <ClusterBadge v-if="useCustomBadge" :cluster="previewCluster" />
        </div>
      </div>

      <div class="row mt-10">
        <div class="col">
          <Checkbox
            v-model="useCustomBadge"
            :label="t('clusterBadge.modal.checkbox')"
            class="mt-10"
          />
        </div>
      </div>

      <div class="options">
        <div class="row mt-10">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="badgeDescription"
              :mode="mode"
              :label="t('clusterBadge.modal.description')"
              :maxlength="32"
              :required="true"
            />
          </div>
        </div>

        <div class="row mt-10">
          <div class="col span-12">
            <ColorInput
              v-model="badgeBgColor"
              :mode="mode"
              :default-value="badgeBgColor"
              :label="t('clusterBadge.modal.badgeBgColor')"
            />
          </div>
        </div>

        <div class="row mt-10">
          <div class="col">
            <Checkbox
              v-model="badgeAsIcon"
              :mode="mode"
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
              :mode="mode"
              :label="t('clusterBadge.modal.iconText')"
              :maxlength="2"
            />
          </div>
        </div>
      </div>
    </div>

    <div slot="actions" class="bottom">
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton :action-label="t('clusterBadge.modal.buttonAction')" :disabled="!canSubmit" @click="apply" />
      </div>
    </div>
  </Card>
</template>
<style lang='scss' scoped>
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
