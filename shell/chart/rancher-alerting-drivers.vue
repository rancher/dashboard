<script>
import Checkbox from '@shell/components/form/Checkbox';
import Banner from '@shell/components/Banner';

export default {
  components: { Banner, Checkbox },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  }
};
</script>
<template>
  <div>
    <Banner color="info">
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
