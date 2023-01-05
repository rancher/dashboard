<script>
import DateComponent from '@shell/components/formatter/Date';
export default {
  components: { DateComponent },
  props:      {
    value: {
      type:    [Object, String],
      default: null,
    },
    row: {
      type:     Object,
      required: true
    },
  },

  data() {
    if (this.value.issuer) {
      const { cn, notAfter, sans = [] } = this.value;

      return {
        cn, expiration: notAfter, sans, isTLS: true
      };
    } else {
      return { isTLS: false };
    }
  },
  computed: {
    // use 'text-warning' or 'text-error' classes if the cert is <8 days from expiring or expired respectively
    dateClass() {
      const eightDays = 691200000;

      if (this.row.timeTilExpiration > eightDays ) {
        return '';
      } else if (this.row.timeTilExpiration > 0) {
        return 'text-warning';
      } else {
        return 'text-error';
      }
    }
  }
};
</script>

<template>
  <div v-if="isTLS">
    <t k="secret.certificate.cn" /> {{ cn }} <span v-if="row.unrepeatedSans.length">{{ t('secret.certificate.plusMore', {n:row.unrepeatedSans.length}) }}</span><br>
    <t k="secret.certificate.expires" />: <DateComponent
      :class="dateClass"
      :value="expiration"
    />
  </div>
  <div v-else>
    {{ value }}
  </div>
</template>
