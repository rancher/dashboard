<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import CruResource from '@shell/components/CruResource';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import EmberPage from '@shell/components/EmberPage';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import {
  CHART, FROM_CLUSTER, SUB_TYPE, _EDIT, _IMPORT, _CONFIG, _VIEW
} from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import { sortBy } from '@shell/utils/sort';
import { set } from '@shell/utils/object';
import { mapPref, PROVISIONER, _RKE1, _RKE2 } from '@shell/store/prefs';
import { filterAndArrangeCharts } from '@shell/store/catalog';
import { CATALOG } from '@shell/config/labels-annotations';
import { CAPI, MANAGEMENT, DEFAULT_WORKSPACE } from '@shell/config/types';
import { mapFeature, RKE2 as RKE2_FEATURE } from '@shell/store/features';
import { allHash } from '@shell/utils/promise';
import { BLANK_CLUSTER } from '@shell/store';
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

// uSed to proxy stylesheets for custom drviers that provide custom UI (RKE1)
const PROXY_ENDPOINT = '/meta/proxy';

export default {
  name: 'CruCluster',

  components: {
    CruResource,
    EmberPage,
    Import,
    Loading,
    Rke2Config,
    SelectIconGrid,
    ToggleSwitch
  },

  mixins: [CreateEditView],

  props: {
    realMode: {
      type:     String,
      required: true,
    },

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
    const hash = {
      // These aren't explicitly used, but need to be listening for change events
      mgmtClusters:     this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      provClusters:     this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),

      catalog: this.$store.dispatch('catalog/load'),
    };

    if (this.$store.getters[`management/canList`](MANAGEMENT.NODE_DRIVER)) {
      hash.nodeDrivers = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_DRIVER });
    }

    if (this.$store.getters[`management/canList`](MANAGEMENT.KONTAINER_DRIVER)) {
      hash.kontainerDrivers = this.$store.dispatch('management/findAll', { type: MANAGEMENT.KONTAINER_DRIVER });
    }

    if ( this.value.id && !this.value.isRke2 ) {
      // These are needed to resolve references in the mgmt cluster -> node pool -> node template to figure out what provider the cluster is using
      // so that the edit iframe for ember pages can go to the right place.
      if (this.$store.getters[`management/canList`](MANAGEMENT.NODE_POOL)) {
        hash.rke1NodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      }

      if (this.$store.getters[`management/canList`](MANAGEMENT.NODE_TEMPLATE)) {
        hash.rke1NodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
      }
    }

    const res = await allHash(hash);

    this.nodeDrivers = res.nodeDrivers || [];
    this.kontainerDrivers = res.kontainerDrivers || [];

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }

    if ( !this.value.id ) {
      if ( !this.value.metadata ) {
        set(this.value, 'metadata', {});
      }

      set(this.value.metadata, 'namespace', DEFAULT_WORKSPACE);
    }

    // For the node drivers, look for custom UI that we can use to show an icon (if not built-in)
    this.nodeDrivers.forEach((driver) => {
      if (!driver.spec?.builtin && driver.spec?.uiUrl && driver.spec?.active) {
        const name = driver.spec?.displayName || driver.id;
        let cssUrl = driver.spec.uiUrl.replace(/\.js$/, '.css');

        if (cssUrl.startsWith('http://') || cssUrl.startsWith('https://')) {
          cssUrl = `${ PROXY_ENDPOINT }/${ cssUrl }`;
        }

        this.loadStylesheet(cssUrl, `driver-ui-css-${ driver.id }`);

        this.iconClasses[name] = `machine-driver ${ name }`;
      }
    });
  },

  data() {
    const subType = this.$route.query[SUB_TYPE] || null;
    const chart = this.$route.query[CHART] || null;
    const isImport = this.realMode === _IMPORT;

    return {
      nodeDrivers:      [],
      kontainerDrivers: [],
      subType,
      chart,
      isImport,
      providerCluster:  null,
      iconClasses:      {},
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    preferredProvisioner: mapPref(PROVISIONER),
    _RKE1:                () => _RKE1,
    _RKE2:                () => _RKE2,

    emberLink() {
      if (this.value) {
        // For custom RKE2 clusters, don't load an Ember page.
        // It should be the dashboard.
        if ( this.value.isRke2 && ((this.value.isCustom && this.mode === _EDIT) || (this.value.isCustom && this.as === _CONFIG && this.mode === _VIEW) || (this.subType || '').toLowerCase() === 'custom')) {
          // For admins, this.value.isCustom is used to check if it is a custom cluster.
          // For cluster owners, this.subtype is used.
          this.selectType('custom', false);

          return '';
        }
        // For RKE2/K3s clusters provisioned in Rancher with node pools,
        // do not use an iFramed Ember page.
        if ( this.value.isRke2 && this.value.machineProvider ) {
          // Edit existing RKE2
          this.selectType(this.value.machineProvider, false);

          return '';
        }
        if ( this.subType ) {
          // For RKE1 and hosted Kubernetes Clusters, set the ember link
          // so that we load the page rather than using RKE2 create
          const selected = this.subTypes.find(s => s.id === this.subType);

          if (selected?.link) {
            return selected.link;
          }

          this.selectType(this.subType, false);

          return '';
        }

        if ( this.value.mgmt?.emberEditPath ) {
          // Iframe an old page
          return this.value.mgmt.emberEditPath;
        }
      }

      return '';
    },

    rke2Enabled: mapFeature(RKE2_FEATURE),

    showRkeToggle() {
      return this.rke2Enabled && !this.isImport;
    },

    provisioner: {
      get() {
        // This can incorrectly return rke1 instead
        // of rke2 for cluster owners.
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
      return this.value.isRke2;
    },

    templateOptions() {
      if ( !this.rke2Enabled ) {
        return [];
      }

      const out = filterAndArrangeCharts(this.allCharts, { showTypes: CATALOG._CLUSTER_TPL });

      return out;
    },

    subTypes() {
      const getters = this.$store.getters;
      const isImport = this.isImport;

      const out = [];

      const templates = this.templateOptions;
      const vueKontainerTypes = getters['plugins/clusterDrivers'];
      const machineTypes = this.nodeDrivers.filter(x => x.spec.active && x.state === 'active').map(x => x.spec.displayName || x.id);

      this.kontainerDrivers.filter(x => (isImport ? x.showImport : x.showCreate)).forEach((obj) => {
        if ( vueKontainerTypes.includes(obj.driverName) ) {
          addType(obj.driverName, 'kontainer', false);
        } else {
          addType(obj.driverName, 'kontainer', false, (isImport ? obj.emberImportPath : obj.emberCreatePath));
        }
      });

      if ( isImport ) {
        addType('import', 'custom', false);
      } else {
        templates.forEach((chart) => {
          out.push({
            id:          `chart:${ chart.id }`,
            label:       chart.chartNameDisplay,
            description: chart.chartDescription,
            icon:        chart.icon || require('~shell/assets/images/generic-catalog.svg'),
            group:       'template',
            tag:         getters['i18n/t']('generic.techPreview')
          });
        });

        if (this.isRke1 ) {
          machineTypes.forEach((id) => {
            addType(id, 'rke1', false, `/g/clusters/add/launch/${ id }`, this.iconClasses[id]);
          });

          addType('custom', 'custom1', false, '/g/clusters/add/launch/custom');
        } else {
          machineTypes.forEach((id) => {
            addType(id, 'rke2', false);
          });

          addType('custom', 'custom2', false);
        }
      }

      return out;

      function addType(id, group, disabled = false, link = null, iconClass = undefined) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';

        let icon;

        try {
          icon = require(`~shell/assets/images/providers/${ id }.svg`);
        } catch (e) {}

        if (icon) {
          iconClass = undefined;
        } else if (!iconClass) {
          icon = require('~shell/assets/images/generic-driver.svg');
        }

        const subtype = {
          id,
          label,
          description,
          icon,
          iconClass,
          group,
          disabled,
          link,
          tag
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
            label: this.$store.getters['i18n/withFallback'](`cluster.providerGroup."${ this.isImport ? 'register-' : 'create-' }${ name }"`, null, name),
            types: [],
            sort:  SORT_GROUPS[name],
          };

          out[name] = entry;
        }

        entry.types.push(row);
      }

      for ( const k in out ) {
        out[k].types = sortBy(out[k].types, 'label');
      }

      return sortBy(Object.values(out), 'sort');
    },
  },

  methods: {
    loadStylesheet(url, id) {
      if ( !id ) {
        console.error('loadStylesheet called without an id'); // eslint-disable-line no-console

        return;
      }

      // Check if the stylesheet has already been loaded
      if ( $(`#${id}`).length > 0 ) { // eslint-disable-line
        return;
      }

      const link = document.createElement('link');

      link.onerror = () => {
        link.remove();
      };
      link.rel = 'stylesheet';
      link.src = url;
      link.href = url;
      link.id = id;
      document.getElementsByTagName('HEAD')[0].appendChild(link);
    },

    cancel() {
      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
          resource: CAPI.RANCHER_CLUSTER,
        },
      });
    },

    colorFor(obj) {
      return `color${ SORT_GROUPS[obj.group] || 1 }`;
    },

    clickedType(obj) {
      const id = obj.id;
      const parts = id.split(':', 2);

      if ( parts[0] === 'chart' ) {
        const chart = this.$store.getters['catalog/chart']({ key: parts[1] });
        let localCluster;

        if (this.$store.getters[`management/canList`](MANAGEMENT.CLUSTER)) {
          localCluster = this.$store.getters['management/all'](MANAGEMENT.CLUSTER).find(x => x.isLocal);
        }

        chart.goToInstall(FROM_CLUSTER, localCluster?.id || BLANK_CLUSTER, true);

        return;
      }

      this.$router.applyQuery({ [SUB_TYPE]: id });
      this.selectType(id);
    },

    selectType(type, fetch = true) {
      const parts = type.split(':', 2);

      if ( parts[0] === 'chart' ) {
        this.subType = 'chart';
        this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider.chart`));
      } else {
        this.subType = type;
        this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));
      }

      if ( fetch ) {
        this.$fetch();
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else-if="emberLink"
    class="embed"
  >
    <EmberPage
      :force-new="true"
      :src="emberLink"
    />
  </div>
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="true"
    :selected-subtype="subType"
    :resource="value"
    :errors="errors"
    :subtypes="subTypes"
    :cancel-event="true"
    class="create-cluster"
    @finish="save"
    @cancel="cancel"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <template #subtypes>
      <div
        v-for="(obj, i) in groupedSubTypes"
        :key="obj.id"
        class="mb-20"
        style="width: 100%;"
      >
        <h4>
          <div
            v-if="showRkeToggle && [_RKE1,_RKE2].includes(obj.name)"
            class="grouped-type"
          >
            <ToggleSwitch
              v-model="provisioner"
              data-testid="cluster-manager-create-rke-switch"
              class="rke-switch"
              off-value="rke1"
              :off-label="t('cluster.toggle.v1')"
              on-value="rke2"
              :on-label="t('cluster.toggle.v2')"
            />
          </div>
          {{ obj.label }}
        </h4>
        <SelectIconGrid
          :rows="obj.types"
          key-field="id"
          name-field="label"
          side-label-field="tag"
          :color-for="colorFor"
          :component-testid="'cluster-manager-create-grid-' + i"
          @clicked="clickedType"
        />
      </div>
    </template>

    <Import
      v-if="isImport"
      v-model="value"
      :mode="mode"
      :provider="subType"
    />
    <Rke2Config
      v-else-if="subType"
      v-model="value"
      :initial-value="initialValue"
      :live-value="liveValue"
      :mode="mode"
      :provider="subType"
    />

    <template
      v-if="subType"
      #form-footer
    >
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
</style>
