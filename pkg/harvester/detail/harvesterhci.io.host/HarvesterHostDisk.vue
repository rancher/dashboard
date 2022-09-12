<script>
import LabelValue from '@shell/components/LabelValue';
import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import HarvesterDisk from '../../mixins/harvester-disk';

export default {
  components: {
    LabelValue,
    BadgeState,
    Banner,
  },

  mixins: [
    HarvesterDisk,
  ],

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

    provisionPhase() {
      return this.value?.blockDevice?.provisionPhase || {};
    },

    mountedMessage() {
      const state = this.value?.blockDevice?.metadata?.state || {};

      if (state?.error) {
        return state?.message;
      } else {
        return '';
      }
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

      if (value.isNew && !!value.originPath) {
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
      v-if="mountedMessage"
      color="error"
      :label="mountedMessage"
    />
    <div v-if="!value.isNew">
      <div class="row">
        <div class="col span-12">
          <div class="pull-right">
            Conditions:
            <BadgeState
              v-tooltip="readyCondition.message"
              :color="readyCondition.status === 'True' ? 'bg-success' : 'bg-error' "
              :icon="readyCondition.status === 'True' ? 'icon-checkmark' : 'icon-warning' "
              label="Ready"
              class="mr-10 ml-10 state"
            />
            <BadgeState
              v-tooltip="schedulableCondition.message"
              :color="schedulableCondition.status === 'True' ? 'bg-success' : 'bg-error' "
              :icon="schedulableCondition.status === 'True' ? 'icon-checkmark' : 'icon-warning' "
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
        <div class="col span-4">
          <LabelValue
            name="Storage Available"
            :value="value.storageAvailable"
          />
        </div>
        <div class="col span-4">
          <LabelValue
            name="Storage Scheduled"
            :value="value.storageScheduled"
          />
        </div>
        <div class="col span-4">
          <LabelValue
            name="Storage Max"
            :value="value.storageMaximum"
          />
        </div>
      </div>
      <hr class="mt-10" />
    </div>
    <div class="row mt-10">
      <div class="col span-4">
        <LabelValue
          :name="t('generic.name')"
          :value="value.displayName"
        />
      </div>
      <div class="col span-4">
        <LabelValue
          :name="t('harvester.host.disk.path.label')"
          :value="value.path"
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
