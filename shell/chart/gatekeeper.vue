<script>
import UnitInput from '@shell/components/form/UnitInput';
import { Checkbox } from '@components/Form/Checkbox';
import { mapGetters } from 'vuex';

export default {
  components: { UnitInput, Checkbox },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    autoInstallInfo: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    crdValues: {
      get() {
        const crdInfo = this.autoInstallInfo.find((info) => info.chart.name.includes('crd'));

        // values are defaults from the chart; allValues are defaults + anything set on previous install if this is an update/upgrade
        return crdInfo ? crdInfo.allValues : null;
      },
      set(values) {
        const crdInfo = this.autoInstallInfo.find((info) => info.chart.name.includes('crd'));

        crdInfo['allValues'] = values;
      }
    }
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <UnitInput
          v-model:value="value.auditInterval"
          :label="t('gatekeeperInstall.auditInterval')"
          :suffix="t('suffix.seconds', {count: value.auditInterval})"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <UnitInput
          v-model:value="value.constraintViolationsLimit"
          :label="t('gatekeeperInstall.constraintViolationsLimit')"
          :suffix="t('gatekeeperIndex.violations')"
        />
      </div>
    </div>

    <template v-if="crdValues">
      <!-- gatekeeper versions <1.0.2 do not have this option -->
      <Checkbox
        v-if="crdValues.enableRuntimeDefaultSeccompProfile ||crdValues.enableRuntimeDefaultSeccompProfile === false"
        v-model:value="crdValues.enableRuntimeDefaultSeccompProfile"
        :label="t('gatekeeperInstall.runtimeDefaultSeccompProfile')"
      />
    </template>
  </div>
</template>
