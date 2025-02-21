<script>
import { abbreviateClusterName } from '@shell/utils/cluster';

export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
    routeCombo: {
      type:    Boolean,
      default: false
    },
  },
  computed: {
    isEnabled() {
      return !!this.cluster?.ready;
    },
    showLocalIcon() {
      if (this.cluster.isLocal && this.cluster.removePreviewColor) {
        return true;
      }

      return this.cluster.isLocal && !this.cluster.isHarvester && !this.cluster.badge?.iconText;
    },

    customColor() {
      return this.cluster.iconColor || '';
    },
  },

  methods: {
    smallIdentifier(input) {
      if (this.cluster.badge?.iconText) {
        return this.cluster.badge?.iconText;
      }

      if (this.cluster.isLocal && !this.cluster.badge?.iconText) {
        return undefined;
      }

      return abbreviateClusterName(input);
    }
  }
};
</script>

<template>
  <div
    v-if="cluster"
    class="cluster-icon-menu"
  >
    <div
      class="cluster-badge-logo"
      :class="{ 'disabled': !isEnabled }"
    >
      <span
        v-if="!showLocalIcon"
        class="cluster-badge-logo-text"
      >
        {{ smallIdentifier(cluster.label) }}
      </span>
      <span
        class="custom-color-decoration"
        :style="{'background': customColor}"
      />
      <svg
        v-if="showLocalIcon"
        class="cluster-local-logo"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
        style="enable-background:new 0 0 100 100;"
        xml:space="preserve"
      >
        <title>{{ t('nav.ariaLabel.localClusterIcon') }}</title>
        <g>
          <g>
            <path
              class="rancher-icon-fill"
              d="M26.0862026,44.4953918H8.6165142c-5.5818157,0-9.3979139-4.6252708-8.4802637-10.1311035l2.858391-17.210701
            C3.912292,11.6477556,6.1382647,7.1128125,7.8419709,7.1128125s3.1788611,4.5368752,3.1788611,10.1186218v4.4837742
            c0,5.5817471,4.4044495,9.5409164,9.9862652,9.5409164h5.0791054V44.4953918z"
            />
          </g>
          <path
            class="rancher-icon-fill"
            d="M63.0214729,92.8871841H37.0862045c-6.0751343,0-11.0000019-4.9248657-11.0000019-11V30.3864384
          c0-6.0751324,4.9248676-11,11.0000019-11h25.9352684c6.0751305,0,11.0000038,4.9248676,11.0000038,11v51.5007477
          C74.0214767,87.9623184,69.0966034,92.8871841,63.0214729,92.8871841z"
          />
          <g>
            <path
              class="rancher-icon-fill"
              d="M73.9137955,44.4953918h17.4696884c5.5818176,0,9.3979187-4.6252708,8.4802628-10.1311035
            l-2.8583908-17.210701c-0.9176483-5.5058317-3.1436234-10.0407753-4.8473282-10.0407753
            s-3.1788635,4.5368752-3.1788635,10.1186218v4.4837742c0,5.5817471-4.4044418,9.5409164-9.9862595,9.5409164h-5.0791092
            V44.4953918z"
            />
          </g>
        </g>
      </svg>
    </div>
    <i
      v-if="!routeCombo && cluster.pinned"
      class="icon icon-pin cluster-pin-icon"
      :alt="t('nav.ariaLabel.pinCluster', { cluster: cluster.nameDisplay })"
    />
    <i
      v-else-if="routeCombo"
      class="icon icon-keyboard_tab key-combo-icon"
      :alt="t('nav.ariaLabel.clusterIconKeyCombo')"
    />
  </div>
</template>

<style lang="scss" scoped>
  .rancher-icon-fill {
    fill: var(--primary);
  }

  .cluster-icon-menu {
    position: relative;
    align-items: center;
    display: flex;
    height: 32px;
    justify-content: center;
    width: 42px;
  }
  .cluster-pin-icon {
    position: absolute;
    top: -6px;
    right: -7px;
    font-size: 14px;
    transform: scaleX(-1);
    color: var(--body-text);
  }
  .key-combo-icon {
    position: absolute;
    top: -7px;
    right: -8px;
    font-size: 14px;
    color: var(--body-text);
    background-color: #dddee6;
    padding: 2px;
    border-radius: 2px;
  }

  .cluster-local-logo {
    width: 20px;
  }

  .cluster-badge-logo {
    width: 42px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--default-active-text);
    font-weight: bold;
    background: var(--nav-icon-badge-bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    font-size: 12px;
    text-transform: uppercase;

    .custom-color-decoration {
      height: 4px;
      width: 100%;
      margin: 0 auto;
      position: absolute;
      bottom: 0px;
      border-radius: 0px 0px 5px 5px;
    }

    &.disabled {
      color: var(--muted);
    }
  }
</style>

<style lang="scss">
  .theme-dark .key-combo-icon  {
    color: var(--body-bg);
  }
</style>
