<script>
import { isV4Format, isV6Format } from 'ip';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import { mapGetters } from 'vuex';
export default {
  components: { CopyToClipboard },
  props:      {
    row: {
      type:     Object,
      required: true
    },
  },
  computed: {
    showBoth() {
      return this.row.internalIp !== this.row.externalIp;
    },
    ...mapGetters({ t: 'i18n/t' })
  },
  methods: {
    isIp(ip) {
      return ip && (isV4Format(ip) || isV6Format(ip));
    }
  }
};
</script>

<template>
  <span>
    <template v-if="isIp(row.externalIp)">
      {{ row.externalIp }} <CopyToClipboard label-as="tooltip" :text="row.externalIp" class="icon-btn" action-color="bg-transparent" />
    </template>
    <template v-else>
      {{ t('generic.none') }}
    </template>

    <template v-if="showBoth">
      <template v-if="isIp(row.internalIp)">
        / {{ row.internalIp }} <CopyToClipboard label-as="tooltip" :text="row.internalIp" class="icon-btn" action-color="bg-transparent" />
      </template>
      <template v-else>
        {{ t('generic.none') }}
      </template>
    </template>
  </span>
</template>
