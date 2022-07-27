<script>
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';

export default {
  components: { Banner, Checkbox },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  computed: {
    mustSelectOne() {
      if (!this.value.prom2teams.enabled && !this.value.sachet.enabled) {
        return 'error';
      }

      return 'info';
    }
  },
  mounted() {
    if (this.mustSelectOne === 'error') {
      this.value.sachet.enabled = true;
    }
  }
};
</script>
<template>
  <div>
    <Banner :color="mustSelectOne">
      {{ t('rancherAlertingDrivers.selectOne') }}
    </Banner>
    <div class="row">
      <div class="col span-6">
        <Checkbox
          v-model="value.prom2teams.enabled"
          label-key="rancherAlertingDrivers.msTeams"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <Checkbox
          v-model="value.sachet.enabled"
          label-key="rancherAlertingDrivers.sms"
        />
      </div>
    </div>
  </div>
</template>
