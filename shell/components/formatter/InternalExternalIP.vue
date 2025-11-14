<script>
import { isV4Format, isV6Format } from 'ip';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import { mapGetters } from 'vuex';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge';

export default {
  components: { CopyToClipboard, RcStatusBadge },
  props:      {
    row: {
      type:     Object,
      required: true
    },
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    filteredExternalIps() {
      return this.row.externalIps?.filter((ip) => this.isIp(ip)) || [];
    },
    filteredInternalIps() {
      return this.row.internalIps?.filter((ip) => this.isIp(ip)) || [];
    },
    internalSameAsExternal() {
      return this.externalIp && this.internalIp && this.externalIp === this.internalIp;
    },
    showPopover() {
      return this.filteredExternalIps.length > 1 || this.filteredInternalIps.length > 1;
    },
    externalIp() {
      return this.filteredExternalIps[0] || null;
    },
    internalIp() {
      return this.filteredInternalIps[0] || null;
    },
    remainingIpCount() {
      let count = 0;

      if (this.filteredExternalIps.length > 1) {
        count += this.filteredExternalIps.length - 1;
      }

      if (!this.internalSameAsExternal && this.filteredInternalIps.length > 1) {
        count += this.filteredInternalIps.length - 1;
      }

      return count;
    },
    tooltipContent() {
      const count = this.remainingIpCount;

      return this.t('internalExternalIP.clickToShowMoreIps', { count });
    },
    remainingExternalIps() {
      return this.filteredExternalIps.slice(1);
    },
    remainingInternalIps() {
      return this.filteredInternalIps.slice(1);
    }
  },
  methods: {
    isIp(ip) {
      return ip && (isV4Format(ip) || isV6Format(ip));
    }
  }
};
</script>

<template>
  <div class="ip-container">
    <template v-if="externalIp">
      <span data-testid="external-ip">
        {{ externalIp }}
        <CopyToClipboard
          :aria-label="t('internalExternalIP.copyExternalIp')"
          label-as="tooltip"
          :text="externalIp"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </span>
    </template>
    <template v-else>
      -
    </template>
    <span class="separator">/</span>
    <template v-if="internalSameAsExternal">
      {{ t('tableHeaders.internalIpSameAsExternal') }}
    </template>
    <template v-else-if="internalIp">
      <span data-testid="internal-ip">
        {{ internalIp }}
        <CopyToClipboard
          :aria-label="t('internalExternalIP.copyInternalIp')"
          label-as="tooltip"
          :text="internalIp"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </span>
    </template>
    <template v-else>
      -
    </template>
    <v-dropdown
      v-if="showPopover"
      ref="dropdown"
      placement="bottom-start"
    >
      <template #default>
        <RcStatusBadge
          v-clean-tooltip="{content: tooltipContent, triggers: ['hover', 'focus']}"
          :aria-label="t('generic.plusMore', {n: remainingIpCount})"
          tabindex="0"
          status="info"
          data-testid="plus-more"
          @click.stop
          @keyup.enter.space="$refs.dropdown.show()"
        >
          {{ t('generic.plusMore', {n: remainingIpCount}) }}
        </RcStatusBadge>
      </template>
      <template #popper>
        <div
          class="ip-addresses-popover"
          data-testid="ip-addresses-popover"
        >
          <button
            class="btn btn-sm close-button"
            @click="$refs.dropdown.hide()"
          >
            <i class="icon icon-close" />
          </button>
          <div
            v-if="remainingExternalIps.length"
            class="ip-list"
            data-testid="external-ip-list"
          >
            <h5>{{ t('generic.externalIps') }}</h5>
            <div
              v-for="ip in remainingExternalIps"
              :key="ip"
              class="ip-address"
            >
              <span>{{ ip }}</span>
              <CopyToClipboard
                :text="ip"
                label-as="tooltip"
                class="icon-btn"
                action-color="bg-transparent"
              />
            </div>
          </div>
          <div
            v-if="remainingInternalIps.length"
            class="ip-list"
            data-testid="internal-ip-list"
          >
            <h5>{{ t('generic.internalIps') }}</h5>
            <div
              v-for="ip in remainingInternalIps"
              :key="ip"
              class="ip-address"
            >
              <span>{{ ip }}</span>
              <CopyToClipboard
                :text="ip"
                label-as="tooltip"
                class="icon-btn"
                action-color="bg-transparent"
              />
            </div>
          </div>
        </div>
      </template>
    </v-dropdown>
  </div>
</template>

<style lang='scss' scoped>
.ip-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 8px 0;
}

.icon-btn {
  padding: 2px;
  min-height: 24px;
}

.rc-status-badge {
  cursor: pointer;
  padding: 0 4px;
}

.ip-addresses-popover {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  padding: 8px;
  gap: 16px;

  .ip-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;

    h5 {
      margin-bottom: 4px;
      font-weight: 600;
    }
  }

  .ip-address {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .close-button {
    position: absolute;
    top: -6px;
    right: -6px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;

    &:hover .icon-close{
      color: var(--primary);
    }
  }
}
</style>
