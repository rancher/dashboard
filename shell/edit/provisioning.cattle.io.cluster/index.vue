<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CruResource from '@shell/components/CruResource';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import EmberPage from '@shell/components/EmberPage';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import {
  CHART, FROM_CLUSTER, SUB_TYPE, RKE_TYPE, _EDIT, _IMPORT, _CONFIG, _VIEW
} from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import { sortBy } from '@shell/utils/sort';
import { PROVISIONER, _RKE1, _RKE2 } from '@shell/store/prefs';
import { filterAndArrangeCharts } from '@shell/store/catalog';
import { CATALOG, CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CAPI, MANAGEMENT, DEFAULT_WORKSPACE } from '@shell/config/types';
import { mapFeature, RKE2 as RKE2_FEATURE, RKE1_UI } from '@shell/store/features';
import { allHash } from '@shell/utils/promise';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { ELEMENTAL_PRODUCT_NAME, ELEMENTAL_CLUSTER_PROVIDER } from '../../config/elemental-types';
import Rke2Config from './rke2';
import { DRIVER_TO_IMPORT } from '@shell/models/management.cattle.io.kontainerdriver';

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

// uSed to proxy stylesheets for custom drivers that provide custom UI (RKE1)
const PROXY_ENDPOINT = '/meta/proxy';
const IMPORTED = 'imported';
const LOCAL = 'local';

export default {
  name: 'CruCluster',

  emits: ['update:value', 'set-subtype', 'input'],

  components: {
    CruResource,
    EmberPage,
    Loading,
    Rke2Config,
    SelectIconGrid,
    ToggleSwitch,
    Banner
  },

  mixins: [CreateEditView],

  inheritAttrs: false,

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
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'cluster-manager-create'
    }
  },

  async fetch() {
    const hash = {
      // These aren't explicitly used, but need to be listening for change events
      mgmtClusters: this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      provClusters: this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
    };

    // No need to fetch charts when editing an RKE1 cluster
    // The computed property `isRke1` in this file is based on the RKE1/RKE2 toggle, which is not applicable in this case
    // Instead, we should rely on the value from the model: `this.value.isRke1`
    if (!this.value.isRke1 || (this.value.isRke1 && this.mode !== 'edit')) {
      hash['catalog'] = this.$store.dispatch('catalog/load');
    }

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
      this.value.spec = {};
    }

    if ( !this.value.id ) {
      if ( !this.value.metadata ) {
        this.value.metadata = {};
      }

      this.value.metadata.namespace = DEFAULT_WORKSPACE;
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

    // Custom Providers from extensions - initialize each with the store and the i18n service
    // Wrap in try ... catch, to prevent errors in an extension breaking the page
    try {
      const extensionClasses = this.$plugin.listDynamic('provisioner').map((name) => this.$plugin.getDynamic('provisioner', name));

      // We can't pass in this.$store as this leads to a circular-reference that causes Vue to freeze,
      // so pass in specific services that the provisioner extension may need
      this.extensions = extensionClasses.map((c) => new c({
        dispatch: this.$store.dispatch,
        getters:  this.$store.getters,
        axios:    this.$store.$axios,
        $plugin:  this.$store.app.$plugin,
        t:        (...args) => this.t.apply(this, args),
        isCreate: this.isCreate,
        isEdit:   this.isEdit,
        isView:   this.isView,
      }));
    } catch (e) {
      console.error('Error loading provisioner(s) from extensions', e); // eslint-disable-line no-console
    }
  },

  data() {
    let subType = null;

    subType = this.$route.query[SUB_TYPE] || null;
    if ( this.$route.query[SUB_TYPE]) {
      subType = this.$route.query[SUB_TYPE];
    } else if (this.value.isImported) {
      subType = IMPORTED;
    } else if (this.value.isLocal) {
      subType = LOCAL;
    }
    const rkeType = this.$route.query[RKE_TYPE] || null;
    const chart = this.$route.query[CHART] || null;
    const isImport = this.realMode === _IMPORT;

    return {
      nodeDrivers:      [],
      kontainerDrivers: [],
      extensions:       [],
      subType,
      rkeType,
      chart,
      isImport,
      providerCluster:  null,
      iconClasses:      {},
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    ...mapGetters('type-map', ['activeProducts']),
    // needed to recreate logic on mapPref in order to incorporate the logic around the rkeType query param
    // https://github.com/rancher/dashboard/issues/6299
    preferredProvisioner: {
      get() {
        if (this.rkeType) {
          return this.rkeType;
        }

        return this.$store.getters['prefs/get'](PROVISIONER);
      },
      set(value) {
        this.$store.dispatch('prefs/set', { key: PROVISIONER, value });
      }
    },
    _RKE1: () => _RKE1,
    _RKE2: () => _RKE2,

    emberLink() {
      if (this.value) {
        // set subtype if editing EKS/GKE/AKS cluster -- this ensures that the component provided by extension is loaded instead of iframing old ember ui
        if (this.value.provisioner) {
          const matchingSubtype = this.subTypes.find((st) => DRIVER_TO_IMPORT[st.id.toLowerCase()] === this.value.provisioner.toLowerCase());

          if (matchingSubtype) {
            this.selectType(matchingSubtype.id, false);
          }
        }

        // subType set by the ui during cluster creation
        // this is likely from a ui extension trying to load custom ui to edit the cluster
        const fromAnnotation = this.value.annotations?.[CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER];

        if (fromAnnotation) {
          this.selectType(fromAnnotation, false);

          return '';
        }

        // For custom RKE2 clusters, don't load an Ember page.
        // It should be the dashboard.
        if ( this.value.isRke2 && ((this.value.isCustom && this.mode === _EDIT) || (this.value.isCustom && this.as === _CONFIG && this.mode === _VIEW) || (this.subType || '').toLowerCase() === 'custom')) {
          // For admins, this.value.isCustom is used to check if it is a custom cluster.
          // For cluster owners, this.subtype is used.
          this.selectType('custom', false);

          return '';
        }
        // For existing RKE2/K3s clusters provisioned in Rancher,
        // set the subtype using the machine pool provisioner
        // do not use an iFramed Ember page.
        if ( this.value.isRke2 && this.value.machineProvider ) {
          this.selectType(this.value.machineProvider, false);

          return '';
        }

        if ( this.subType ) {
          // if driver type has a custom form component, don't load an ember page
          if (this.selectedSubType?.component) {
            return '';
          }
          // For RKE1 and hosted Kubernetes Clusters, set the ember link
          // so that we load the page rather than using RKE2 create
          if (this.selectedSubType?.emberLink) {
            return this.selectedSubType.emberLink;
          }

          return '';
        }

        if ( this.value.mgmt?.emberEditPath ) {
          // Iframe an old page
          return this.value.mgmt.emberEditPath;
        }
      }

      return '';
    },

    rke2Enabled:   mapFeature(RKE2_FEATURE),
    rke1UiEnabled: mapFeature(RKE1_UI),

    // todo nb is this info stored anywhere else..?
    selectedSubType() {
      return this.subType ? this.subTypes.find((s) => s.id === this.subType) : null;
    },

    provisioner: {
      get() {
        // This can incorrectly return rke1 instead
        // of rke2 for cluster owners.
        if ( !this.rke2Enabled ) {
          return _RKE1;
        }

        if ( !this.rke1UiEnabled ) {
          return _RKE2;
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
      return this.value.isRke2 || !this.isRke1;
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
      const isElementalActive = !!this.activeProducts.find((item) => item.name === ELEMENTAL_PRODUCT_NAME);
      let out = [];

      const templates = this.templateOptions;
      const vueKontainerTypes = getters['plugins/clusterDrivers'];
      const machineTypes = this.nodeDrivers.filter((x) => x.spec.active && x.state === 'active');

      this.kontainerDrivers.filter((x) => (isImport ? x.showImport : x.showCreate)).forEach((obj) => {
        if ( vueKontainerTypes.includes(obj.driverName) ) {
          addType(this.$plugin, obj.driverName, 'kontainer', false);
        } else {
          addType(this.$plugin, obj.driverName, 'kontainer', false, (isImport ? obj.emberImportPath : obj.emberCreatePath));
        }
      });
      if (!isImport) {
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

        if (isElementalActive) {
          // !this.subType means we are on the /create screen - we only want to show for rke2
          // if a subType is selected, always add the ELEMENTAL_CLUSTER_PROVIDER type to cover edit scenarios
          if ((!this.subType && !this.isRke1) || this.subType) {
            addType(this.$plugin, ELEMENTAL_CLUSTER_PROVIDER, 'custom2', false);
          }
        }

        if (this.isRke1 ) {
          machineTypes.forEach((type) => {
            const id = type.spec.displayName || type.id;

            addType(this.$plugin, id, _RKE1, false, `/g/clusters/add/launch/${ id }`, this.iconClasses[id], type);
          });

          addType(this.$plugin, 'custom', 'custom1', false, '/g/clusters/add/launch/custom');
        } else {
          machineTypes.forEach((type) => {
            const id = type.spec.displayName || type.id;

            addType(this.$plugin, id, _RKE2, false, null, undefined, type);
          });

          addType(this.$plugin, 'custom', 'custom2', false);
        }
      }
      // Add from extensions
      this.extensions.forEach((ext) => {
        // if the rke toggle is set to rke1, don't add extensions that specify rke2 group
        // default group is rke2
        if (!this.isRke2 && (ext.group === _RKE2 || !ext.group)) {
          return;
        }
        // Do not show the extension provisioner on the import cluster page unless its explicitly set to do so
        if (isImport && !ext.showImport) {
          return;
        }
        // Do not show the extension provisioner on create if it is disabled
        if (!isImport && !!ext.hideCreate) {
          return;
        }
        // Allow extensions to overwrite provisioners with the same id
        out = out.filter((type) => type.id !== ext.id);
        addExtensionType(ext, getters);
      });

      return out;

      function addExtensionType(ext, getters) {
        let iconClass = ext.iconClass;
        let icon = ext.icon;

        if (icon) {
          iconClass = undefined;
        } else if (!iconClass) {
          icon = require('~shell/assets/images/generic-driver.svg');
        }

        const subtype = {
          id:          ext.id,
          label:       ext.label || getters['i18n/t'](`cluster.provider.${ ext.id }`),
          description: ext.description,
          icon,
          iconClass,
          group:       ext.group || _RKE2,
          disabled:    ext.disabled || false,
          link:        ext.link,
          tag:         ext.tag,
          component:   ext.component,
          hidden:      ext.hidden,
        };

        out.push(subtype);
      }

      function addType(plugin, id, group, disabled = false, emberLink = null, iconClass = undefined, providerConfig = undefined) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';

        // Look at extensions first
        // An extension can override the icon for a provider with
        // plugin.register('image', 'providers/openstack.svg', require('~shell/assets/images/providers/exoscale.svg'));
        let icon = plugin.getDynamic('image', `providers/${ id }.svg`);

        if (!icon) {
          try {
            icon = require(`~shell/assets/images/providers/${ id }.svg`);
          } catch (e) {}
        }

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
          emberLink,
          tag,
          providerConfig
        };

        out.push(subtype);
      }
    },

    filteredSubTypes() {
      return this.subTypes.filter((subtype) => !subtype.hidden);
    },

    groupedSubTypes() {
      const out = {};

      for ( const row of this.filteredSubTypes ) {
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

    firstNodeDriverItem() {
      return this.groupedSubTypes.findIndex((obj) => [_RKE1, _RKE2].includes(obj.name));
    },

    firstCustomClusterItem() {
      return this.groupedSubTypes.findIndex((obj) => ['custom', 'custom1', 'custom2'].includes(obj.name));
    },

    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    },
  },

  methods: {
    showRkeToggle(i) {
      if (this.isImport || !this.rke2Enabled) {
        return false;
      }

      if (this.firstNodeDriverItem >= 0) {
        return i === this.firstNodeDriverItem;
      }

      return i === this.firstCustomClusterItem;
    },

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
          localCluster = this.$store.getters['management/all'](MANAGEMENT.CLUSTER).find((x) => x.isLocal);
        }

        chart.goToInstall(FROM_CLUSTER, localCluster?.id || BLANK_CLUSTER, true);

        return;
      }
      if (obj.link) {
        this.$router.push(obj.link);

        return;
      }

      this.$router.applyQuery({ [SUB_TYPE]: id, [RKE_TYPE]: this.preferredProvisioner });
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
    :prevent-enter-submit="true"
    class="create-cluster"
    @finish="save"
    @cancel="cancel"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <template #subtypes>
      <div
        v-for="(obj, i) in groupedSubTypes"
        :key="i"
        :class="{'mt-5': i === 0, 'mt-20': i !== 0 }"
        style="width: 100%;"
      >
        <h4>
          <div
            v-if="showRkeToggle(i) && rke1UiEnabled"
            class="grouped-type"
          >
            <ToggleSwitch
              v-model:value="provisioner"
              data-testid="cluster-manager-create-rke-switch"
              class="rke-switch"
              :off-value="_RKE1"
              :off-label="t('cluster.toggle.v1')"
              :on-value="_RKE2"
              :on-label="t('cluster.toggle.v2')"
            />
          </div>
          {{ obj.label }}
        </h4>
        <Banner
          v-if="provisioner === _RKE1 && i === 1"
          color="warning"
          label-key="cluster.banner.rke1DeprecationShortMessage"
        />
        <SelectIconGrid
          :rows="obj.types"
          key-field="id"
          name-field="label"
          side-label-field="tag"
          :color-for="colorFor"
          component-testid="cluster-manager-create-grid"
          @clicked="clickedType"
        />
      </div>
    </template>

    <template v-if="subType">
      <!-- allow extensions to provide their own cluster provisioning form -->
      <component
        :is="selectedSubType.component"
        v-if="selectedSubType && selectedSubType.component"
        v-model:value="localValue"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :provider="subType"
        :provider-config="selectedSubType.providerConfig"
        @update:value="$emit('input', $event)"
      />
      <Rke2Config
        v-else
        v-model:value="localValue"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :provider="subType"
        :provider-config="selectedSubType.providerConfig"
        @update:value="$emit('input', $event)"
      />
    </template>

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
