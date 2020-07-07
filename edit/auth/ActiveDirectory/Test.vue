<script>
import LabeledInput from '@/components/form/LabeledInput';
import { mapGetters } from 'vuex';
export default {
  components: { LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) }
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput v-model="value.username" :label="t('auth.username')" />
    </div>
    <div class="col span-6">
      <LabeledInput v-model="value.password" type="password" :label="t('auth.password')" />
    </div>
  </div>
</template>
