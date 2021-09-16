<script>
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import LabelValue from '@/components/LabelValue';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';

export default {
  components: {
    LabeledInput,
    UnitInput,
    LabelValue,
    BadgeState,
    Banner,
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
  },
  methods: {
    update() {
      this.$emit('input', this.value);
    },

    canEditPath(value) {
      if (this.mountedMessage) {
        return true;
      }

      if (value.isNew && !value.originPath) {
        return true;
      }

      return false;
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
      <div class="col span-6">
        <LabeledInput
          v-model="value.displayName"
          :label="t('generic.name')"
          :disabled="true"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.path"
          :label="t('harvester.host.disk.path.label')"
          :disabled="!canEditPath(value)"
          required
        />
      </div>
    </div>
    <div v-if="false" class="row mt-10">
      <div class="col span-6">
        <UnitInput
          v-model="value.storageReserved"
          v-int-number
          suffix="GiB"
          label-key="harvester.host.disk.storageReserved.label"
          :mode="mode"
          :disabled="true"
        />
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
