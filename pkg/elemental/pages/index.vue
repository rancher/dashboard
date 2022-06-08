<script>
import { ELEMENTAL_SCHEMA_IDS } from '../types';
import { allHash } from '@shell/utils/promise';
import { createElementalRoute } from '../utils/custom-routing';
import Loading from '@shell/components/Loading';

export default {
  name:       'Dashboard',
  components: { Loading },
  async fetch() {
    const allDispatches = await allHash({
      machineRegistrations: this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS }),
      machineInventories:   this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES }),
      managedOsImages:      this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES }),
    });

    this.resourcesData = {};

    this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS] = allDispatches.machineRegistrations;
    this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES] = allDispatches.machineInventories;
    this.resourcesData[ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES] = allDispatches.managedOsImages;
  },
  data() {
    return {
      createMachineRegistration: createElementalRoute('resource-create', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS }),
      manageMachineRegistration: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS }),
      manageMachineInventories:  createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES }),
      createManagedOsImages:     createElementalRoute('resource-create', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES }),
      manageManagedOsImages:     createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES })
    };
  },
  computed: {
    cards() {
      const out = [];

      [ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS,
        ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES,
        'elementalClusters',
        ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES].forEach((type) => {
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
          btnDisabled = !this.resourcesData[type]?.length;
          break;
        case ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES:
          btnDisabled = !this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS]?.length;
          break;
        case 'elementalClusters':
          btnDisabled = !this.resourcesData[ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES]?.length;
          break;
        case ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES:
          btnDisabled = true;
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
