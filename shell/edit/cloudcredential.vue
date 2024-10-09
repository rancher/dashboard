<script>
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { MANAGEMENT, NORMAN, SCHEMA, DEFAULT_WORKSPACE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CruResource from '@shell/components/CruResource';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';
import Labels from '@shell/components/form/Labels';
import { HIDE_SENSITIVE } from '@shell/store/prefs';
import { CAPI } from '@shell/config/labels-annotations';
import { clear, uniq } from '@shell/utils/array';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { set } from '@shell/utils/object';
import { mapFeature, RKE2 as RKE2_FEATURE } from '@shell/store/features';
import { rke1Supports } from '@shell/store/plugins';

export default {
  name: 'CruCloudCredential',

  emits: ['set-subtype', 'input'],

  components: {
    Loading,
    NameNsDescription,
    CruResource,
    Labels,
    SelectIconGrid
  },

  mixins: [CreateEditView],

  async fetch() {
    this.nodeDrivers = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_DRIVER });
    this.kontainerDrivers = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.KONTAINER_DRIVER });

    // Force reload the cloud cred schema and any missing subtypes because there aren't change events sent when drivers come/go
    try {
      const schema = await this.$store.dispatch('rancher/find', {
        type: SCHEMA,
        id:   NORMAN.CLOUD_CREDENTIAL,
        opt:  {
          force: true,
          url:   `schemas/${ NORMAN.CLOUD_CREDENTIAL }`,
        },
      });

      for ( const k in schema.resourceFields ) {
        if ( !k.endsWith('Config') ) {
          continue;
        }

        const id = schema.resourceFields[k].type;

        if ( !this.$store.getters['rancher/schemaFor'](id) ) {
          await this.$store.dispatch('rancher/find', {
            type: SCHEMA,
            id,
            opt:  {
              force: true,
              url:   `schemas/${ id }`,
            },
          });
        }
      }
    } catch (e) {
    }

    if ( !this.value._name ) {
      set(this.value, '_name', '');
    }

    if (this.mode === _EDIT && this.value?.name?.length) {
      this.value._name = this.value.name;
      this.nameRequiredValidation = true;
    }

    if ( this.value.provider ) {
      this.selectType(this.value.provider);
    }
  },

  data() {
    return {
      credCustomComponentValidation: false,
      nameRequiredValidation:        false,
      nodeDrivers:                   null,
      kontainerDrivers:              null
    };
  },

  watch: {
    'value._name'(newValue) {
      this.nameRequiredValidation = newValue?.length > 0;
    }
  },

  computed: {
    rke2Enabled: mapFeature(RKE2_FEATURE),

    validationPassed() {
      return this.credCustomComponentValidation && this.nameRequiredValidation;
    },

    storeOverride() {
      return 'rancher';
    },

    driverName() {
      return this.value?.provider;
    },

    cloudComponent() {
      if (this.$store.getters['type-map/hasCustomCloudCredentialComponent'](this.driverName)) {
        return this.$store.getters['type-map/importCloudCredential'](this.driverName);
      }

      return this.$store.getters['type-map/importCloudCredential']('generic');
    },

    // array of id, label, description, initials for type selection step
    secretSubTypes() {
      const out = [];

      const drivers = [...this.nodeDrivers, ...this.kontainerDrivers]
        .filter((x) => x.spec.active && x.id !== 'rancherkubernetesengine')
        .map((x) => x.spec.displayName || x.id);

      let types = uniq(drivers.map((x) => this.$store.getters['plugins/credentialDriverFor'](x)));

      if ( !this.rke2Enabled ) {
        types = types.filter((x) => rke1Supports.includes(x));
      }

      const schema = this.$store.getters['rancher/schemaFor'](NORMAN.CLOUD_CREDENTIAL);

      types = types.filter((name) => {
        const key = this.$store.getters['plugins/credentialFieldForDriver'](name);
        const subSchemaName = schema.resourceFields[`${ key }credentialConfig`]?.type;

        if ( !subSchemaName ) {
          return;
        }

        const subSchema = this.$store.getters['rancher/schemaFor'](subSchemaName);

        if ( !subSchema ) {
          return false;
        }

        const fields = subSchema.resourceFields;

        return fields && Object.keys(fields).length > 0;
      });

      if ( schema.resourceFields['s3credentialConfig'] ) {
        types.push('s3');
      }

      for ( const id of types ) {
        let bannerAbbrv;

        let bannerImage = this.$store.app.$plugin.getDynamic('image', `providers/${ id }.svg`);

        if (!bannerImage) {
          try {
            bannerImage = require(`~shell/assets/images/providers/${ id }.svg`);
          } catch (e) {
            bannerImage = null;
            bannerAbbrv = this.initialDisplayFor(id);
          }
        }

        out.push({
          id,
          label: this.typeDisplay(CAPI.CREDENTIAL_DRIVER, id),
          bannerImage,
          bannerAbbrv
        });
      }

      return sortBy(out, 'label');
    },

    hideSensitiveData() {
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },

    doneRoute() {
      return 'c-cluster-manager-cloudCredential';
    },
  },

  methods: {

    createValidationChanged(passed) {
      this.credCustomComponentValidation = passed;
    },

    async saveCredential(btnCb) {
      if ( this.errors ) {
        clear(this.errors);
      }

      if ( typeof this.$refs.cloudComponent?.test === 'function' ) {
        try {
          const res = await this.$refs.cloudComponent.test();

          if ( !res || res?.errors) {
            if (res?.errors) {
              this.errors = res.errors;
            } else {
              this.errors = ['Authentication test failed, please check your credentials'];
            }
            btnCb(false);

            return;
          }
        } catch (e) {
          this.errors = [e];
          btnCb(false);

          return;
        }
      }

      return this.save(btnCb);
    },

    selectType(type) {
      let driver;

      if ( type === TYPES.CLOUD_CREDENTIAL ) {
        // Clone goes through here
        driver = this.driverName;
      } else {
        driver = type;
        type = TYPES.CLOUD_CREDENTIAL;
      }

      if ( this.mode === _CREATE ) {
        this.value.setAnnotation(CAPI.CREDENTIAL_DRIVER, driver);
        this.value.metadata.generateName = 'cc-';
        this.value.metadata.namespace = DEFAULT_WORKSPACE;

        const field = this.$store.getters['plugins/credentialFieldForDriver'](driver);

        set(this.value, `${ field }credentialConfig`, {});
      }

      this.value['_type'] = type;
      this.$emit('set-subtype', this.typeDisplay(type, driver));
    },

    typeDisplay(type, driver) {
      return this.$store.getters['i18n/withFallback'](`cluster.provider."${ driver }"`, null, driver);
    },

    initialDisplayFor(type) {
      const fallback = (ucFirst(this.typeDisplay(type) || '').replace(/[^A-Z]/g, '') || type).substr(0, 3);

      return this.$store.getters['i18n/withFallback'](`secret.initials."${ type }"`, null, fallback);
    },

    updateValue(key, value) {
      this.value.setData(key, value);
    }
  },
};
</script>

<template>
  <form class="filled-height">
    <Loading v-if="$fetchState.pending" />
    <CruResource
      v-else
      :mode="mode"
      :validation-passed="validationPassed"
      :selected-subtype="value._type"
      :resource="value"
      :errors="errors"
      :done-route="doneRoute"
      :subtypes="secretSubTypes"
      :can-yaml="false"
      @finish="saveCredential"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <NameNsDescription
        :value="value"
        :name-editable="true"
        name-key="_name"
        description-key="description"
        name-label="cluster.credential.name.label"
        name-placeholder="cluster.credential.name.placeholder"
        :mode="mode"
        :namespaced="false"
        @update:value="$emit('input', $event)"
      />
      <keep-alive>
        <component
          :is="cloudComponent"
          ref="cloudComponent"
          :driver-name="driverName"
          :value="value"
          :mode="mode"
          :hide-sensitive-data="hideSensitiveData"
          @validationChanged="createValidationChanged"
          @valueChanged="updateValue"
        />
      </keep-alive>
    </CruResource>
  </form>
</template>

<style lang='scss'>
</style>
