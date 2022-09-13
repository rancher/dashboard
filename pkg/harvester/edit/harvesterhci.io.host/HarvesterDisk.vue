<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabelValue from '@shell/components/LabelValue';
import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import { RadioGroup, RadioButton } from '@components/Form/Radio';

export default {
  components: {
    LabeledInput,
    LabelValue,
    BadgeState,
    Banner,
    RadioGroup,
    RadioButton,
  },

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
    disks: {
      type:    Array,
      default: () => [],
    },
    mode: {
      type:    String,
      default: 'edit',
    },
  },
  data() {
    return {};
  },
  computed: {
    allowSchedulingOptions() {
      return [{
        label: this.t('generic.enabled'),
        value: true,
      }, {
        label: this.t('generic.disabled'),
        value: false,
      }];
    },

    evictionRequestedOptions() {
      return [{
        label: this.t('generic.yes'),
        value: true,
      }, {
        label: this.t('generic.no'),
        value: false,
      }];
    },

    readyCondiction() {
      return this.value?.conditions?.Ready || {};
    },

    schedulableCondiction() {
      return this.value?.conditions?.Schedulable || {};
    },

    mountedMessage() {
      const state = this.value?.blockDevice?.metadata?.state || {};

      if (state?.error) {
        return state?.message;
      } else {
        return '';
      }
    },

    isProvisioned() {
      return this.value?.blockDevice?.spec.fileSystem.provisioned;
    },

    forceFormattedDisabled() {
      const lastFormattedAt = this.value?.blockDevice?.status?.deviceStatus?.fileSystem?.LastFormattedAt;
      const fileSystem = this.value?.blockDevice?.status?.deviceStatus?.fileSystem.type;

      const systems = ['ext4', 'XFS'];

      if (lastFormattedAt) {
        return true;
      } else if (systems.includes(fileSystem)) {
        return false;
      } else if (!fileSystem) {
        return true;
      } else {
        return !this.canEditPath;
      }
    },

    canEditPath() {
      if (this.mountedMessage) {
        return true;
      }

      if (this.value.isNew && !this.value.originPath) {
        return true;
      }

      return false;
    },

    isFormatted() {
      return !!this.value?.blockDevice?.status?.deviceStatus?.fileSystem?.LastFormattedAt;
    },

    formattedBannerLabel() {
      const system = this.value?.blockDevice?.status?.deviceStatus?.fileSystem?.type;

      const label = this.t('harvester.host.disk.lastFormattedAt.info');

      if (system) {
        return `${ label } ${ this.t('harvester.host.disk.fileSystem.info', { system }) }`;
      } else {
        return label;
      }
    },

    provisionPhase() {
      return this.value?.blockDevice?.provisionPhase || {};
    },
  },
  methods: {
    update() {
      this.$emit('input', this.value);
    },
  },
};
</script>

<template>
  <div class="disk" @input="update">
    <div class="mt-30" />
    <Banner
      v-if="mountedMessage && isProvisioned"
      color="error"
      :label="mountedMessage"
    />
    <Banner
      v-if="isFormatted"
      color="info"
      :label="formattedBannerLabel"
    />
    <div v-if="!value.isNew">
      <div class="row">
        <div class="col span-12">
          <div class="pull-right">
            Conditions:
            <BadgeState
              v-tooltip="readyCondiction.message"
              :color="readyCondiction.status === 'True' ? 'bg-success' : 'bg-error' "
              :icon="readyCondiction.status === 'True' ? 'icon-checkmark' : 'icon-warning' "
              label="Ready"
              class="mr-10 ml-10 state"
            />
            <BadgeState
              v-tooltip="schedulableCondiction.message"
              :color="schedulableCondiction.status === 'True' ? 'bg-success' : 'bg-error' "
              :icon="schedulableCondiction.status === 'True' ? 'icon-checkmark' : 'icon-warning' "
              label="Schedulable"
              class="mr-10 state"
            />
            <BadgeState
              v-if="provisionPhase.label"
              :color="provisionPhase.color"
              :icon="provisionPhase.icon"
              :label="provisionPhase.label"
              class="mr-10 state"
            />
          </div>
        </div>
      </div>
      <div v-if="!value.isNew" class="row mt-30">
        <div class="col flex span-12">
          <LabelValue
            name="Storage Available"
            :value="value.storageAvailable"
          />
          <LabelValue
            name="Storage Scheduled"
            :value="value.storageScheduled"
          />
          <LabelValue
            name="Storage Max"
            :value="value.storageMaximum"
          />
        </div>
      </div>
      <hr class="mt-10" />
    </div>
    <div class="row mt-10">
      <div class="col span-12">
        <LabeledInput
          v-model="value.displayName"
          :label="t('generic.name')"
          :disabled="true"
        />
      </div>
    </div>
    <div v-if="value.isNew && !isFormatted" class="row mt-10">
      <div class="col span-6">
        <RadioGroup
          v-model="value.forceFormatted"
          :mode="mode"
          name="forceFormatted"
          label-key="harvester.host.disk.forceFormatted.label"
          :labels="[t('generic.no'),t('harvester.host.disk.forceFormatted.yes')]"
          :options="[false, true]"
          :disabled="forceFormattedDisabled"
          tooltip-key="harvester.host.disk.forceFormatted.toolTip"
        >
          <template #1="{option, listeners}">
            <RadioButton
              :label="option.label"
              :val="option.value"
              :value="value.forceFormatted"
              :disabled="forceFormattedDisabled && !value.forceFormatted"
              v-on="listeners"
            />
          </template>
        </RadioGroup>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.close {
  top: 10px;
  right: 10px;
  padding:0;
  position: absolute;
}

.disk {
  position: relative;

  .secret-name {
    height: $input-height;
  }

  &:not(:last-of-type) {
    padding-bottom: 10px;
    margin-bottom: 30px;
  }
}

.flex {
  display: flex;
  justify-content: space-between;
}

.badge-state {
    padding: 2px 5px;
}
</style>
