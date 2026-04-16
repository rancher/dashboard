<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CruResource from '@shell/components/CruResource';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import {
  CHART, FROM_CLUSTER, SUB_TYPE, RKE_TYPE, _EDIT, _IMPORT, _CONFIG, _VIEW
} from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import { sortBy } from '@shell/utils/sort';
import { PROVISIONER, _RKE2 } from '@shell/store/prefs';
import { filterAndArrangeCharts } from '@shell/store/catalog';
import { CATALOG, CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CAPI, MANAGEMENT, DEFAULT_WORKSPACE } from '@shell/config/types';
import { mapFeature, RKE2 as RKE2_FEATURE } from '@shell/store/features';
import { allHash } from '@shell/utils/promise';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { ELEMENTAL_PRODUCT_NAME, ELEMENTAL_CLUSTER_PROVIDER } from '../../config/elemental-types';
import { KONTAINER_TO_DRIVER } from '@shell/models/management.cattle.io.kontainerdriver';
import Rke2Config from './rke2';
import { requireAsset } from '@shell/utils/require-asset';

const SORT_GROUPS = {
  template:  1,
  kontainer: 2,
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
    Loading,
    Rke2Config,
    SelectIconGrid,
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
    // We can't pass in this.$store as this leads to a circular-reference that causes Vue to freeze,
    // so pass in specific services that the provisioner extension may need
    const context = {
      dispatch:   this.$store.dispatch,
      getters:    this.$store.getters,
      axios:      this.$store.$axios,
      $extension: this.$store.app.$extension,
      t:          (...args) => this.t.apply(this, args),
      isCreate:   this.isCreate,
      isEdit:     this.isEdit,
      isView:     this.isView,
    };

    this.extensions = this.$extension.getProviders(context);

    // At this point, we know we definitely have the mgmt cluster, so we can access `isImported` and `isLocal`
    let subType = null;

    subType = this.$route.query[SUB_TYPE] || null;
    if ( this.$route.query[SUB_TYPE]) {
      subType = this.$route.query[SUB_TYPE];
    } else if (this.value.isImported) {
      // Default imported clusters to the generic imported subType.
      // Imported hosted clusters (e.g. AKS, EKS, GKE) that have an extension-provided
      // component will be overridden below to load the correct custom form.
      subType = IMPORTED;
    } else if (this.value.isLocal) {
      subType = LOCAL;
    }

    // For imported hosted clusters, check if the provisioner has a matching extension
    // component and override the subType so the correct custom form loads instead of
    // the generic imported configuration page.
    if (subType === IMPORTED && this.value?.id && this.value.provisioner) {
      const provisionerLower = this.value.provisioner.toLowerCase();
      const hasExtension = this.extensions.some((ext) => ext.id === provisionerLower);

      if (hasExtension) {
        subType = provisionerLower;
      }
    }

    // Auto-detect subType for existing clusters being edited
    if ( !subType && this.value?.id ) {
      // Check for extension annotation first
      const fromAnnotation = this.value.annotations?.[CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER];

      if (fromAnnotation) {
        subType = fromAnnotation;
      } else if ( this.value.isRke2 ) {
        // For custom RKE2 clusters
        if ( this.value.isCustom && (this.realMode === _EDIT || (this.as === _CONFIG && this.realMode === _VIEW)) ) {
          subType = 'custom';
        } else if ( this.value.machineProvider ) {
          // For RKE2/K3s clusters provisioned in Rancher, use the machine pool provisioner
          subType = this.value.machineProvider;
        }
      } else if ( this.value.provisioner ) {
        // For non-RKE2 clusters, try to match against extension-provided subtypes
        const provisionerLower = this.value.provisioner.toLowerCase();

        // This will be checked against available subtypes after they're computed
        subType = provisionerLower;
      }
    }

    this.subType = subType;
  },

  data() {
    const rkeType = this.$route.query[RKE_TYPE] || null;
    const chart = this.$route.query[CHART] || null;
    const isImport = this.realMode === _IMPORT;

    return {
      nodeDrivers:      [],
      kontainerDrivers: [],
      extensions:       [],
      subType:          null,
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
    _RKE2: () => _RKE2,

    rke2Enabled: mapFeature(RKE2_FEATURE),

    // todo nb is this info stored anywhere else..?
    selectedSubType() {
      return this.subType ? this.subTypes.find((s) => s.id === this.subType) : null;
    },

    provisioner: {
      get() {
        return this.preferredProvisioner;
      },

      set(neu) {
        this.preferredProvisioner = neu;
      },
    },

    isRke1() {
      return this.value.isRke1;
    },

    isRke2() {
      return this.value.isRke2;
    },

    isEmberKontainerDriver() {
      // RKE2/K3s clusters are never legacy Ember kontainer drivers
      if (!this.value?.id || !this.value?.provisioner || this.value.isRke2) {
        return false;
      }

      const provisioner = this.value.provisioner.toLowerCase();
      // Resolve the provisioner to a driver name using the KONTAINER_TO_DRIVER map
      const resolvedName = KONTAINER_TO_DRIVER[provisioner] || provisioner;

      const driver = this.kontainerDrivers.find((d) => {
        return d.driverName === resolvedName || d.driverName === provisioner || d.id === provisioner;
      });

      // If the driver exists and is not built-in, it's a legacy ember driver
      return !!driver && !driver.spec?.builtIn;
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
      const machineTypes = this.nodeDrivers.filter((x) => x.spec.active && x.state === 'active');

      // Kontainer drivers that don't have an extension-provided component are legacy Ember-based
      // and no longer functional. Show them as disabled with an informational tooltip.
      const emberRemovalTooltip = getters['i18n/t']('drivers.kontainer.emberRemovalTooltip');

      this.kontainerDrivers.filter((x) => (isImport ? x.showImport : x.showCreate)).forEach((obj) => {
        addType(this.$extension, obj.driverName, 'hosted', true, undefined, undefined, emberRemovalTooltip);
      });
      if (!isImport) {
        templates.forEach((chart) => {
          out.push({
            id:          `chart:${ chart.id }`,
            label:       chart.chartNameDisplay,
            description: chart.chartDescription,
            icon:        chart.icon || requireAsset('~shell/assets/images/generic-catalog.svg'),
            group:       'template',
            tag:         getters['i18n/t']('generic.techPreview')
          });
        });

        // If Elemental is installed, then add the elemental cluster provider
        if (isElementalActive) {
          addType(this.$extension, ELEMENTAL_CLUSTER_PROVIDER, 'custom2', false);
        }

        // Only add the RKE2 options if RKE2 is enabled
        if (this.rke2Enabled) {
          machineTypes.forEach((type) => {
            const id = type.spec.displayName || type.id;

            addType(this.$extension, id, _RKE2, false, undefined, type);
          });

          addType(this.$extension, 'custom', 'custom2', false);
        }
      }
      // Add from extensions
      this.extensions.forEach((ext) => {
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
          icon = requireAsset('~shell/assets/images/generic-driver.svg');
        }

        const subtype = {
          id:        ext.id,
          label:     ext.label || getters['i18n/t'](`cluster.provider.${ ext.id }`),
          icon,
          iconClass,
          group:     ext.group || _RKE2,
          disabled:  ext.disabled || false,
          link:      ext.link,
          tag:       ext.tag,
          component: ext.component,
          hidden:    ext.hidden,
        };

        out.push(subtype);
      }

      function addType(plugin, id, group, disabled = false, iconClass = undefined, providerConfig = undefined, tooltip = undefined) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';

        // Look at extensions first
        // An extension can override the icon for a provider with
        // plugin.register('image', 'providers/openstack.svg', require('~shell/assets/images/providers/exoscale.svg'));
        let icon = plugin.getDynamic('image', `providers/${ id }.svg`);

        if (!icon) {
          try {
            icon = requireAsset(`~shell/assets/images/providers/${ id }.svg`);
          } catch (e) {}
        }

        if (icon) {
          iconClass = undefined;
        } else if (!iconClass) {
          icon = requireAsset('~shell/assets/images/generic-driver.svg');
        }

        const subtype = {
          id,
          label,
          description,
          icon,
          iconClass,
          group,
          disabled,
          tag,
          tooltip,
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
      return this.groupedSubTypes.findIndex((obj) => [_RKE2].includes(obj.name));
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
    v-else-if="isRke1"
  >
    <Banner
      color="warning"
      label-key="cluster.banner.rke1DeprecationMessage"
    />
  </div>
  <div
    v-else-if="isEmberKontainerDriver"
  >
    <Banner
      color="warning"
      label-key="drivers.kontainer.emberRemovalMessage"
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
          {{ obj.label }}
        </h4>
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
        :is="selectedSubType?.component"
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
        :provider-config="selectedSubType?.providerConfig"
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
