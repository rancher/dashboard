<script>
import { MANAGEMENT, HOSTED_PROVIDER } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { STATE, NAME } from '@shell/config/table-headers';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@components/Banner/Banner.vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { getHostedProviders } from '@shell/utils/provider';

export default {
  name:       'HostedProviders',
  components: {
    ResourceTable, Masthead, RcStatusBadge, Banner
  },
  data() {
    return {
      errors:          [],
      rows:            [],
      allProviders:    null,
      resource:        HOSTED_PROVIDER,
      schema:          this.$store.getters['rancher/schemaFor'](HOSTED_PROVIDER),
      settingResource: null
    };
  },
  fetch() {
    this.allProviders = this.getProviders();
    this.getSettings();
    this.generateRows();
  },
  watch: {
    settings() {
      this.generateRows();
    },
    allProviders() {
      this.generateRows();
    }
  },
  computed: {
    headers() {
      return [
        STATE,
        NAME,
      ];
    },
    settings() {
      const providerTypesJSON = this.settingResource?.value;
      const providerTypes = providerTypesJSON ? JSON.parse(providerTypesJSON) : [];
      const settingsDict = {};

      providerTypes.forEach((p) => {
        settingsDict[p.name] = p.active;
      });

      return settingsDict;
    },

  },
  methods: {
    getProviders() {
      const context = {
        dispatch:   this.$store.dispatch,
        getters:    this.$store.getters,
        axios:      this.$store.$axios,
        $extension: this.$store.app.$extension,
        t:          (...args) => this.t.apply(this, args),
      };

      return getHostedProviders(context);
    },
    getSettings() {
      this.settingResource = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.KEV2_OPERATORS );
    },
    stateDisplay(row) {
      if (!row.active) {
        return stateDisplay(STATES_ENUM.INACTIVE);
      }

      return stateDisplay(STATES_ENUM.ACTIVE);
    },
    async setSetting(resources, active) {
      try {
        const providerTypes = this.settingResource.value ? JSON.parse(this.settingResource.value) : [];
        const providerMap = new Map(providerTypes.map((prov) => [prov.name, prov]));

        resources.forEach((resource) => {
          const provider = providerMap.get(resource.id);

          if (provider) {
            provider.active = active;
          } else {
            providerMap.set(resource.id, { name: resource.id, active });
          }
        });

        this.settingResource.value = JSON.stringify(Array.from(providerMap.values()));
        await this.settingResource.save();
        this.getSettings();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }
    },
    async generateRows() {
      this.rows = this.allProviders.map((p) => {
        const active = p.id in this.settings ? this.settings[p.id] : true;
        const canNotChangeSettings = !this.settingResource?.canUpdate;
        const enableAction = {
          action:   'activate',
          label:    this.t('action.activate'),
          icon:     'icon icon-play',
          bulkable: true,
          enabled:  !active && !canNotChangeSettings,
          invoke:   async(opts, resources) => {
            await this.setSetting(resources, true);
          }
        };
        const disableAction = {
          action:   'deactivate',
          label:    this.t('action.deactivate'),
          icon:     'icon icon-pause',
          bulkable: true,
          enabled:  active && !canNotChangeSettings,
          weight:   -1,
          invoke:   async(opts, resources) => {
            await this.setSetting(resources, false);
          }
        };
        const availableActions = [enableAction, disableAction];

        return {
          id:          p.id,
          name:        p.label,
          nameDisplay: p.label,
          description: p.description || '',
          active,
          availableActions
        };
      }) || [];
    },
    closeError(index) {
      this.errors.splice(index, 1);
    },
  },
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="t('providers.hosted.title')"
      :is-creatable="false"
    />
    <Banner
      color="warning"
      :label="t('providers.hosted.warning')"
      :closable="false"
    />
    <Banner
      v-for="(err, i) in errors"
      :key="i"
      color="error"
      :label="err"
      :closable="true"
      @close="closeError(i)"
    />
    <ResourceTable
      :schema="schema"
      :resource="resource"
      :rows="rows"
      :headers="headers"
      :row-actions="true"
      :table-actions="true"
      :data-testid="'hosted-provider-list'"
      key-field="id"
    >
      <template #cell:state="{row}">
        <RcStatusBadge
          :status="!row.active ? 'error' : 'success'"
        >
          {{ stateDisplay(row) }}
        </RcStatusBadge>
      </template>
      <template #cell:name="{row}">
        <div class="col">
          <div class="row">
            <span class="mr-10">{{ row.name }}</span>
          </div>
          <div
            v-if="row.description"
            class="description text-muted text-small"
          >
            {{ row.description }}
          </div>
        </div>
      </template>
    </ResourceTable>
  </div>
</template>
