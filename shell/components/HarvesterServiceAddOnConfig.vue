<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';
import { get } from '@shell/utils/object';
import { HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';

const HARVESTER_ADD_ON_CONFIG = [{
  variableName: 'ipam',
  key:          HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM,
  default:      'dhcp'
}];

export default {
  components: { LabeledSelect },

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'harvesterWillSave');
    }
  },

  data() {
    const harvesterAddOnConfig = {};

    HARVESTER_ADD_ON_CONFIG.forEach((c) => {
      harvesterAddOnConfig[c.variableName] = this.value.metadata.annotations[c.key] || c.default;
    });

    return { ...harvesterAddOnConfig };
  },

  computed: {
    ipamOptions() {
      return [{
        label: 'DHCP',
        value: 'dhcp',
      }, {
        label: 'Pool',
        value: 'pool',
      }];
    },

    portOptions() {
      const ports = this.value?.spec?.ports || [];

      return ports.filter(p => p.port && p.protocol === 'TCP').map(p => p.port) || [];
    },
  },

  methods: {
    willSave() {
      HARVESTER_ADD_ON_CONFIG.forEach((c) => {
        this.value.metadata.annotations[c.key] = String(get(this, c.variableName));
      });
    },
  },
};
</script>

<template>
  <div>
    <div class="row mt-30">
      <div class="col span-6">
        <LabeledSelect
          v-model="ipam"
          :mode="mode"
          :options="ipamOptions"
          :label="t('servicesPage.harvester.ipam.label')"
        />
      </div>
    </div>
  </div>
</template>
