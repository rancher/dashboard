<script>
import { ELEMENTAL_SCHEMA_IDS, ELEMENTAL_CLUSTER_PROVIDER } from '@shell/config/elemental-types';
import { allHash } from '@shell/utils/promise';
import { createElementalRoute } from '../utils/custom-routing';
import { filterForElementalClusters } from '../utils/elemental-utils';
import Loading from '@shell/components/Loading';
import { CAPI } from '@shell/config/types';

export default {
  name:       'Dashboard',
  components: { Loading },
  async fetch() {
    const allDispatches = await allHash({
      machineRegistrations: this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS }),
      machineInventories:   this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES }),
      rancherClusters:      this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
      managedOsImages:      this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES }),
    });

    this.resourcesData = {};

    this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS] = allDispatches.machineRegistrations;
    this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES] = allDispatches.machineInventories;
    this.resourcesData[this.ELEMENTAL_CLUSTERS] = filterForElementalClusters(allDispatches.rancherClusters);
    this.resourcesData[ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES] = allDispatches.managedOsImages;
  },
  data() {
    return { ELEMENTAL_CLUSTERS: 'elementalClusters' };
  },
  computed: {
    cards() {
      const out = [];

      const clusterCreateRoute = {
        name:   'c-cluster-product-resource-create',
        params: {
          resource: CAPI.RANCHER_CLUSTER,
          product:  'manager',
        },
        query: { type: ELEMENTAL_CLUSTER_PROVIDER }
      };

      const clusterManageRoute = {
        name:   'c-cluster-product-resource',
        params: {
          resource: CAPI.RANCHER_CLUSTER,
          product:  'manager',
        }
      };

      [
        ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS,
        ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES,
        this.ELEMENTAL_CLUSTERS,
        // hide for now, until it's more mature and we know how to integrate it with the whole flow...
        // ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES
      ].forEach((type) => {
        const obj = {
          count:    this.resourcesData[type]?.length || 0,
          title:    this.t(`typeLabel."${ type }"`, { count: 2 }),
          desc:     this.t(`description."${ type }"`),
          btnLabel: this.t(`elemental.dashboard.btnLabel.${ this.resourcesData[type]?.length ? 'manage' : 'create' }."${ type }"`),
          btnRoute: createElementalRoute(`resource${ !this.resourcesData[type]?.length ? '-create' : '' }`, { resource: type })
        };

        let btnDisabled;

        switch (type) {
        case ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS:
          btnDisabled = false;
          break;
        case ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES:
          btnDisabled = !this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS]?.length && !this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES]?.length;
          break;
        case this.ELEMENTAL_CLUSTERS:
          btnDisabled = !this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES]?.length && !this.resourcesData[this.ELEMENTAL_CLUSTERS]?.length;
          !this.resourcesData[type]?.length ? obj.btnRoute = clusterCreateRoute : obj.btnRoute = clusterManageRoute;
          break;
        case ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES:
          btnDisabled = !this.resourcesData[this.ELEMENTAL_CLUSTERS]?.length && !this.resourcesData[ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES]?.length;
          break;
        }

        obj.btnDisabled = btnDisabled;
        out.push(obj);
      });

      return out;
    }
  },
  methods: {
    handleRoute(card) {
      if (!card.btnDisabled) {
        this.$router.replace(card.btnRoute);
      }
    }
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <h1 class="title">
        {{ t('elemental.menuLabels.dashboard') }}
      </h1>
      <div class="main-card-container">
        <div
          v-for="card, index in cards"
          :key="index"
          class="card"
        >
          <div class="card-top-block">
            <h2>{{ card.count }}</h2>
            <p>{{ card.title }}</p>
          </div>
          <span>{{ card.desc }}</span>
          <button
            type="button"
            class="btn role-primary"
            :class="{disabled: card.btnDisabled}"
            @click="handleRoute(card)"
          >
            {{ card.btnLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  margin: 20px 0 20px 0;
}

.main-card-container {
  display: flex;
  flex-wrap: wrap;

  .card {
    width: fit-content;
    display: flex;
    flex-direction: column;
    margin: 0 40px 40px 0;

    .card-top-block {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0 20px 0 0;
        font-weight: bold;
      }

      p {
        font-weight: bold;
      }
    }

    span {
      margin-bottom: 10px;
      color: var(--disabled-text);
    }

    button {
      justify-content: center;
    }
  }
}

.elemental-empty-dashboard {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100%;

  .icon-fleet {
    font-size: 100px;
    color: var(--disabled-text);
  }

  > p > span {
    color: var(--disabled-text);
  }
}
</style>
