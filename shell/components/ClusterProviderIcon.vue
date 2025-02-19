<script>
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
    small: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    useForIcon() {
      return !!this.cluster?.badge?.iconText;
    },
    showBorders() {
      return this.cluster?.badge?.color === 'transparent';
    },
  }
};
</script>

<template>
  <div
    v-if="cluster"
    class="cluster-icon"
    :class="{'cluster-icon-small': small}"
  >
    <div
      v-if="useForIcon"
      class="cluster-badge-logo"
      :class="{ 'cluster-icon-border': showBorders}"
      :style="{ backgroundColor: cluster.badge.color, color: cluster.badge.textColor }"
    >
      {{ cluster.badge.iconText }}
    </div>
    <!-- eslint-disable -->
    <svg 
      v-else-if="cluster.isLocal && !cluster.isHarvester" 
      class="cluster-local-logo" 
      version="1.1" 
      id="Layer_1" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlns:xlink="http://www.w3.org/1999/xlink" 
      x="0px" 
      y="0px" 
      viewBox="0 0 100 100" 
      style="enable-background:new 0 0 100 100;" 
      xml:space="preserve">
      <title>{{ t('nav.ariaLabel.clusterProvIcon', { cluster: 'local' }) }}</title>
      <g>
        <g>
          <path class="rancher-icon-fill" d="M26.0862026,44.4953918H8.6165142c-5.5818157,0-9.3979139-4.6252708-8.4802637-10.1311035l2.858391-17.210701
            C3.912292,11.6477556,6.1382647,7.1128125,7.8419709,7.1128125s3.1788611,4.5368752,3.1788611,10.1186218v4.4837742
            c0,5.5817471,4.4044495,9.5409164,9.9862652,9.5409164h5.0791054V44.4953918z"/>
        </g>
        <path class="rancher-icon-fill" d="M63.0214729,92.8871841H37.0862045c-6.0751343,0-11.0000019-4.9248657-11.0000019-11V30.3864384
          c0-6.0751324,4.9248676-11,11.0000019-11h25.9352684c6.0751305,0,11.0000038,4.9248676,11.0000038,11v51.5007477
          C74.0214767,87.9623184,69.0966034,92.8871841,63.0214729,92.8871841z"/>
        <g>
          <path class="rancher-icon-fill" d="M73.9137955,44.4953918h17.4696884c5.5818176,0,9.3979187-4.6252708,8.4802628-10.1311035
            l-2.8583908-17.210701c-0.9176483-5.5058317-3.1436234-10.0407753-4.8473282-10.0407753
            s-3.1788635,4.5368752-3.1788635,10.1186218v4.4837742c0,5.5817471-4.4044418,9.5409164-9.9862595,9.5409164h-5.0791092
            V44.4953918z"/>
        </g>
      </g>
    </svg>
    <!-- eslint-enable -->
    <img
      v-else-if="cluster.providerNavLogo"
      class="cluster-os-logo"
      :src="cluster.providerNavLogo"
      :alt="t('nav.ariaLabel.clusterProvIcon', { cluster: cluster.nameDisplay })"
    >
  </div>
</template>

<style lang="scss" scoped>
  .rancher-icon-fill {
    fill: var(--primary);
  }
  .cluster-icon {
    align-items: center;
    display: flex;
    height: 32px;
    justify-content: center;
    width: 42px;

    &-border {
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--body-text) !important; // !important is needed to override the color set by the badge when there's a transparent background.
    }
  }

  .cluster-icon-small {
    height: 25px;
    width: 25px;

    .cluster-os-logo {
      width: 25px;
      height: 25px;
    }

    .cluster-badge-logo {
      width: 25px;
      height: 25px;
    }
  }

  .cluster-os-logo {
    width: 32px;
    height: 32px;
  }
  .cluster-local-logo {
    display: flex;
    width: 25px;
  }
  .cluster-badge-logo {
    min-width: 42px;
    height: 32px;
    padding: 0px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    font-weight: bold;
  }
</style>
