<script>
import { RcButton } from '@components/RcButton';
import { MANAGEMENT, CAPI } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { MODE, _IMPORT } from '@shell/config/query-params';
import WidgetCard from './WidgetCard.vue';

// NAVIGATION — buttons that take you somewhere in Rancher.
//
// A Home is a launch pad, and the thing people do from it most is LEAVE for the page they actually
// wanted. The other widgets answer "what is going on"; this one answers "take me there".
//
// Destinations are named, not hand-written routes: a person picks "Cluster management" or "Import
// an existing cluster", and this resolves it to the real route. That is deliberate — a Home that
// stored raw paths would rot the first time Rancher reorganised its routing, and nobody editing a
// dashboard should have to know that a cluster list is `c-cluster-product-resource`.
//
// A custom destination is still possible: give a button a `to` and it goes there instead.
const DESTINATIONS = {
  clusterManagement: {
    label: 'Cluster management',
    icon:  'icon-cluster-management',
    route: () => ({
      name:   'c-cluster-product-resource',
      params: {
        product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
      }
    }),
  },
  createCluster: {
    label: 'Create a cluster',
    icon:  'icon-plus',
    route: () => ({
      name:   'c-cluster-product-resource-create',
      params: {
        product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
      }
    }),
  },
  importCluster: {
    label: 'Import an existing cluster',
    icon:  'icon-download',
    route: () => ({
      name:   'c-cluster-product-resource-create',
      params: {
        product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
      },
      query: { [MODE]: _IMPORT },
    }),
  },
  explorer: {
    label: 'Explore the local cluster',
    icon:  'icon-compass',
    route: () => ({ name: 'c-cluster-explorer', params: { cluster: 'local' } }),
  },
  apps: {
    label: 'Apps',
    icon:  'icon-apps',
    route: () => ({
      name:   'c-cluster-product-resource',
      params: {
        product: EXPLORER, cluster: 'local', resource: 'catalog.cattle.io.app'
      }
    }),
  },
  users: {
    label: 'Users & Authentication',
    icon:  'icon-user',
    route: () => ({
      name:   'c-cluster-product-resource',
      params: {
        product: 'auth', cluster: BLANK_CLUSTER, resource: MANAGEMENT.USER
      }
    }),
  },
  settings: {
    label: 'Global settings',
    icon:  'icon-gear',
    route: () => ({
      name:   'c-cluster-product-resource',
      params: {
        product: 'settings', cluster: BLANK_CLUSTER, resource: MANAGEMENT.SETTING
      }
    }),
  },
  extensions: {
    label: 'Extensions',
    icon:  'icon-plug',
    route: () => ({ name: 'c-cluster-uiplugins', params: { cluster: BLANK_CLUSTER } }),
  },
};

/** Every destination a navigation button can point at, for the settings picker. */
export const NAV_DESTINATIONS = Object.entries(DESTINATIONS).map(([id, d]) => ({ value: id, label: d.label }));

export default {
  name:       'WidgetNav',
  components: { RcButton, WidgetCard },

  props: {
    widget: {
      type:    Object,
      default: () => ({}),
    },
  },

  computed: {
    buttons() {
      const wanted = this.widget.links?.length ? this.widget.links : Object.keys(DESTINATIONS).slice(0, 4).map((id) => ({ url: id }));

      return wanted.map((link, i) => {
        const dest = DESTINATIONS[link.url];

        return {
          key:      `${ link.url }-${ i }`,
          label:    link.label || dest?.label || link.url,
          icon:     dest?.icon,
          // A named destination resolves to a route; anything else is taken as a path or a URL.
          to:       dest ? dest.route() : link.url,
          external: !dest && /^https?:\/\//.test(link.url || ''),
        };
      });
    },

    variant() {
      return this.widget.where === 'custom' ? 'secondary' : 'link';
    },
  },
};
</script>

<template>
  <WidgetCard
    :title="widget.title"
    :empty="!buttons.length"
    empty-text="No destinations yet — pick some in this widget's settings."
  >
    <div class="wnav">
      <a
        v-for="button in buttons.filter((b) => b.external)"
        :key="button.key"
        :href="button.to"
        rel="nofollow noopener noreferrer"
        target="_blank"
        class="wnav__item"
      >
        <RcButton :variant="variant">
          <i
            v-if="button.icon"
            class="icon"
            :class="button.icon"
          />
          {{ button.label }}
        </RcButton>
      </a>
      <RcButton
        v-for="button in buttons.filter((b) => !b.external)"
        :key="button.key"
        :variant="variant"
        :to="button.to"
        class="wnav__item"
      >
        <i
          v-if="button.icon"
          class="icon"
          :class="button.icon"
        />
        {{ button.label }}
      </RcButton>
    </div>
  </WidgetCard>
</template>

<style lang="scss" scoped>
.wnav {
  display:        flex;
  flex-direction: column;
  gap:            8px;

  &__item {
    justify-content: flex-start;
    text-decoration: none;
    width:           100%;

    i {
      margin-right: 8px;
    }
  }
}
</style>
