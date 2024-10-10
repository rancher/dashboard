<script>

export default {
  props: {
    value: {
      type:     [Number, String],
      required: true
    },

    row: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    verbose: {
      type:    Boolean,
      default: false,
    }

  },

  computed: {
    outputString() {
      return this.verbose ? this.verboseOutputString : this.row.expiresString;
    },

    verboseOutputString() {
      const expireData = this.row?.expireData;

      if (expireData?.expired) {
        return this.t('cluster.cloudCredentials.expired');
      } else if (expireData?.expiring) {
        return this.t('cluster.cloudCredentials.expiring', { expires: this.row.expiresString });
      }

      return null;
    }
  }
};
</script>

<template>
  <div
    v-if="outputString"
    class="cloud-cred-expired"
    :class="{ 'text-error': row.expireData.expired, 'text-warning': row.expireData.expiring}"
  >
    <div class="token-icon mr-5">
      <i
        class="icon"
        :class="{'icon-error': row.expireData.expired, 'icon-warning': row.expireData.expiring}"
      />
    </div>
    {{ outputString }}
  </div>
</template>

<style lang="scss" scoped>
.cloud-cred-expired {
  display: flex;
  align-items: center;
  .token-icon {
    display: flex;
    align-items: center;
  }
}
</style>
