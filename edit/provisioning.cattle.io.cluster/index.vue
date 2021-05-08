<script>
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import SelectIconGrid from '@/components/SelectIconGrid';
import EmberPage from '@/components/EmberPage';
import ToggleSwitch from '@/components/form/ToggleSwitch';
import { REGISTER, SUB_TYPE, _FLAGGED } from '@/config/query-params';
import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';
import { mapGetters } from 'vuex';
import { sortBy } from '@/utils/sort';
import { set } from '@/utils/object';
import { mapPref, PROVISIONER, _RKE1, _RKE2 } from '@/store/prefs';
import { filterAndArrangeCharts } from '@/store/catalog';
import { CATALOG } from '@/config/labels-annotations';
import { MANAGEMENT } from '@/config/types';
import { mapFeature, RKE2 as RKE2_FEATURE } from '@/config/feature-flags';
import Rke2Config from './rke2';
import Import from './import';

const SORT_GROUPS = {
  template:  1,
  kontainer: 2,
  rke1:      3,
  rke2:      3,
  register:  4,
  custom:    5,
  custom1:   5,
  custom2:   5,
};

// Map some provider IDs to icon names where they don't directly match
const ICON_MAPPINGS = { linode: 'linodelke' };

export default {
  name: 'CruCluster',

  components: {
    Loading,
    CruResource,
    SelectIconGrid,
    Rke2Config,
    Import,
    EmberPage,
    ToggleSwitch,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:    Object,
      default: null,
    }
  },

  async fetch() {
    this.nodeDrivers = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_DRIVER });
    this.kontainerDrivers = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.KONTANIER_DRIVER });

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }

    if ( this.subType ) {
      await this.selectType(this.subType, false);
    } else if ( this.value.isImported ) {
      this.isRegister = true;
      this.selectType('import', false);
    } else if ( this.value.isCustom ) {
      this.selectType('custom', false);
    } else if ( this.value.nodeProvider ) {
      await this.selectType(this.value.nodeProvider, false);
    } else {
      await this.$store.dispatch('catalog/load');
    }

    if ( !this.value.id ) {
      if ( !this.value.metadata ) {
        set(this.value, 'metadata', {});
      }

      set(this.value.metadata, 'namespace', DEFAULT_WORKSPACE);
    }
  },

  data() {
    const subType = this.$route.query[SUB_TYPE] || null;
    const isRegister = this.$route.query[REGISTER] === _FLAGGED;

    return {
      nodeDrivers:      [],
      kontainerDrivers:     [],
      subType,
      isRegister,
      providerCluster:  null,
      emberLink:        null,
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    preferredProvisioner: mapPref(PROVISIONER),
    _RKE1:                () => _RKE1,
    _RKE2:                () => _RKE2,

    rke2Enabled: mapFeature(RKE2_FEATURE),

    showRkeToggle() {
      return this.rke2Enabled && !this.isRegister;
    },

    provisioner: {
      get() {
        if ( !this.rke2Enabled ) {
          return _RKE1;
        }

        return this.preferredProvisioner;
      },

      set(neu) {
        this.preferredProvisioner = neu;
      },
    },

    isRke1() {
      return this.provisioner === _RKE1;
    },

    isRke2() {
      return this.provisioner === _RKE2;
    },

    templateOptions() {
      return filterAndArrangeCharts(this.allCharts, { showTypes: CATALOG._CLUSTER_TPL }).map(x => x.id);
    },

    subTypes() {
      const getters = this.$store.getters;
      const isRegister = this.isRegister;

      const out = [];

      const templates = this.templateOptions;
      const vueMachineTypes = getters['plugins/machineDrivers'];
      const vueKontainerTypes = getters['plugins/clusterDrivers'];
      const machineTypes = this.nodeDrivers.filter(x => x.spec.active).map(x => x.id);

      this.kontainerDrivers.filter(x => (isRegister ? x.showRegister : x.showCreate)).forEach((obj) => {
        if ( vueKontainerTypes.includes(obj.driverName) ) {
          addType(obj.driverName, 'kontainer', false);
        } else {
          addType(obj.driverName, 'kontainer', false, (isRegister ? obj.emberRegisterPath : obj.emberCreatePath));
        }
      });

      if ( isRegister ) {
        addType('import', 'custom', false);
      } else {
        templates.forEach((id) => {
          addType(id, 'template', true);
        });

        if (this.isRke1 ) {
          machineTypes.forEach((id) => {
            addType(id, 'rke1', false, `/g/clusters/add/launch/${ id }`);
          });

          addType('custom', 'custom1', false, '/g/clusters/add/launch/custom');
        } else {
          machineTypes.forEach((id) => {
            addType(id, 'rke2', !vueMachineTypes.includes(id));
          });

          addType('custom', 'custom2', false);
        }
      }

      return out;

      function addType(id, group, disabled = false, link = null) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        let icon = require('~/assets/images/generic-driver.svg');

        const iconID = ICON_MAPPINGS[id] || id;

        if ( group !== 'template' ) {
          try {
            icon = require(`~/assets/images/providers/${ iconID }.svg`);
          } catch (e) {}
        }

        const subtype = {
          id,
          label,
          description,
          icon,
          group,
          disabled,
          link
        };

        out.push(subtype);
      }
    },

    groupedSubTypes() {
      const out = {};

      for ( const row of this.subTypes ) {
        const name = row.group;
        let entry = out[name];

        if ( !entry ) {
          entry = {
            name,
            label: this.$store.getters['i18n/withFallback'](`cluster.providerGroup."${ this.isRegister ? 'register-' : 'create-' }${ name }"`, null, name),
            types: [],
            sort:  SORT_GROUPS[name],
          };

          out[name] = entry;
        }

        entry.types.push(row);
      }

      return sortBy(Object.values(out), 'sort');
    },
  },

  methods: {
    colorFor(obj) {
      return `color${ SORT_GROUPS[obj.group] || 1 }`;
    },

    clickedType(obj) {
      const id = obj.id;

      this.emberLink = obj.link;
      this.$router.applyQuery({ [SUB_TYPE]: id });
      this.selectType(id);
    },

    selectType(type, fetch = true) {
      this.subType = type;
      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));

      if ( fetch ) {
        this.$fetch();
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="true"
    :selected-subtype="subType"
    :resource="value"
    :errors="errors"
    :subtypes="subTypes"
    @finish="save"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <template #subtypes>
      <div v-for="obj in groupedSubTypes" :key="obj.id" class="mb-20" style="width: 100%;">
        <h4>
          <div v-if="showRkeToggle && [_RKE1,_RKE2].includes(obj.name)" class="grouped-type">
            <ToggleSwitch
              v-model="provisioner"
              class="rke-switch"
              off-value="rke1"
              off-label="RKE"
              on-value="rke2"
              on-label="RKE2"
            />
          </div>
          {{ obj.label }}
        </h4>
        <SelectIconGrid
          :rows="obj.types"
          key-field="id"
          name-field="label"
          :color-for="colorFor"
          @clicked="clickedType"
        />
      </div>
    </template>

    <!-- @TODO load appropriate component for provider -->
    <Import
      v-if="isRegister"
      v-model="value"
      :mode="mode"
      :provider="subType"
    />
    <div v-else-if="emberLink" class="embed">
      <EmberPage :src="emberLink" />
    </div>
    <Rke2Config
      v-else-if="subType"
      v-model="value"
      :mode="mode"
      :provider="subType"
    />

    <template v-if="subType" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
<style lang='scss'>
  .grouped-type {
    position: relative;
  }

  .rke-switch {
    margin-top: -10px;
    position: absolute;
    right: 0;
  }

  .embed {
    position: absolute;
    top: var(--header-height);
    height: calc(100vh - var(--header-height));
    left: var(--nav-width);
    width: calc(100vw - var(--nav-width));
  }
</style>
