<script>
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { NORMAN, DEFAULT_WORKSPACE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { Banner } from '@components/Banner';
import { CAPI } from '@shell/config/labels-annotations';
import { clear } from '@shell/utils/array';
import cloneDeep from 'lodash/cloneDeep';

const _NEW = '_NEW';
const _NONE = '_NONE';

export default {
  emits: ['update:value', 'credential-created'],

  components: {
    Loading, LabeledSelect, CruResource, NameNsDescription, Banner
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:    String,
      default: null,
    },

    provider: {
      type:    String,
      default: null,
    },

    cancel: {
      type:    Function,
      default: null
    },

    showingForm: {
      type:     Boolean,
      required: true,
    }
  },

  async fetch() {
    this.allCredentials = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

    const field = this.$store.getters['plugins/credentialFieldForDriver'](this.driverName);

    this.newCredential = await this.$store.dispatch('rancher/create', {
      type:     NORMAN.CLOUD_CREDENTIAL,
      metadata: {
        namespace:   DEFAULT_WORKSPACE,
        annotations: { [CAPI.CREDENTIAL_DRIVER]: this.driverName }
      },
      [`${ field }credentialConfig`]: {}
    });

    if ( this.value ) {
      this.credentialId = this.value;
    } else if ( this.filteredCredentials.length === 1 ) {
      // Auto pick the first credential if there's only one
      this.credentialId = this.filteredCredentials[0].id;
    } else if ( !this.filteredCredentials.length ) {
      this.credentialId = _NEW;
    }
  },

  data() {
    return {
      allCredentials:                [],
      nodeComponent:                 null,
      credentialId:                  this.value || _NONE,
      newCredential:                 null,
      credCustomComponentValidation: false,
      nameRequiredValidation:        false,
      originalId:                    this.value
    };
  },

  computed: {
    hasCustomCloudCredentialComponent() {
      const driverName = this.driverName;

      return this.$store.getters['type-map/hasCustomCloudCredentialComponent'](driverName);
    },

    cloudCredentialComponent() {
      const driverName = this.driverName;

      return this.$store.getters['type-map/importCloudCredential'](driverName);
    },

    genericCloudCredentialComponent() {
      return this.$store.getters['type-map/importCloudCredential']('generic');
    },

    cloudComponent() {
      if (this.hasCustomCloudCredentialComponent) {
        return this.cloudCredentialComponent;
      }

      return this.genericCloudCredentialComponent;
    },

    isNone() {
      return this.credentialId === null || this.credentialId === _NONE;
    },

    isNew() {
      return this.credentialId === _NEW;
    },

    isPicked() {
      return !!this.credentialId && !this.isNone && !this.isNew;
    },

    driverName() {
      let driver = this.provider;

      // Map providers that share a common credential to one driver
      driver = this.$store.getters['plugins/credentialDriverFor'](driver);

      return driver;
    },

    filteredCredentials() {
      return this.allCredentials.filter((x) => x.provider === this.driverName);
    },

    options() {
      const duplicates = {};

      this.filteredCredentials.forEach((cred) => {
        duplicates[cred.nameDisplay] = duplicates[cred.nameDisplay] === null ? true : null;
      });

      const out = this.filteredCredentials.map((obj) => ({
        // if credential name is duplicated we add the id to the label
        label: duplicates[obj.nameDisplay] ? `${ obj.nameDisplay } (${ obj.id })` : obj.nameDisplay,
        value: obj.id,
      }));

      if ( this.originalId && !out.find((x) => x.value === this.originalId) ) {
        out.unshift({
          label: `${ this.originalId.replace(/^cattle-global-data:/, '') } (current)`,
          value: this.originalId
        });
      }

      out.unshift({
        label: this.t('cluster.credential.select.option.new'),
        value: _NEW,
      });

      out.unshift({
        label:    this.t('cluster.credential.select.option.none'),
        value:    _NONE,
        disabled: true,
      });

      return out;
    },

    validationPassed() {
      if ( this.credentialId === _NONE ) {
        return false;
      }

      if ( this.credentialId === _NEW ) {
        return this.credCustomComponentValidation && this.nameRequiredValidation;
      }

      return !!this.credentialId;
    },
  },

  watch: {
    credentialId(val) {
      if ( val === _NEW || val === _NONE ) {
        this.$emit('update:value', null);
      } else {
        this.$emit('update:value', val);
      }
    },
    'newCredential.name'(newValue) {
      this.nameRequiredValidation = newValue?.length > 0;
    }
  },

  methods: {

    async save(btnCb) {
      if ( this.errors ) {
        clear(this.errors);
      }
      const fullCredential = cloneDeep(this.newCredential);

      if ( typeof this.$refs.create?.test === 'function' ) {
        try {
          const res = await this.$refs.create.test();

          if ( !res ) {
            this.errors = ['Authentication test failed, please check your credentials'];
            btnCb(false);

            return;
          }
        } catch (e) {
          this.errors = [e];
          btnCb(false);

          return;
        }
      }

      if ( this.newCredential.metadata.name ) {
        delete this.newCredential.metadata.generateName;
      } else {
        this.newCredential.metadata.generateName = 'cloud-credential-';
      }

      try {
        const res = await this.newCredential.save();

        this.credentialId = res.id;
        // full cloud credential data is not stored in the cloud credentail CRD, but consuming components may want to use it
        this.$emit('credential-created', fullCredential);
        btnCb(true);
      } catch (e) {
        this.errors = [e];
        btnCb(false);
      }
    },

    createValidationChanged(passed) {
      this.credCustomComponentValidation = passed;
    },

    backToExisting() {
      this.credentialId = _NONE;
    },
    updateCredentialValue(key, value) {
      this.newCredential.setData(key, value);
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="validationPassed"
    :resource="newCredential"
    :can-yaml="false"
    :cancel-event="true"
    :errors="errors"
    finish-button-mode="continue"
    class="select-credentials"
    :class="{'select-credentials__showingForm': showingForm}"
    @finish="save"
    @cancel="cancel"
    @error="e=>errors = e"
  >
    <div v-if="isNew">
      <Banner
        :label="t('cluster.credential.banner.createCredential', {length: options.length}, true)"
        color="info"
      />

      <NameNsDescription
        v-model:value="newCredential"
        :namespaced="false"
        :description-hidden="true"
        name-key="name"
        name-label="cluster.credential.name.label"
        name-placeholder="cluster.credential.name.placeholder"
        mode="create"
      />

      <component
        :is="cloudComponent"
        ref="create"
        v-model:value="newCredential"
        mode="create"
        :driver-name="driverName"
        @validationChanged="createValidationChanged"
        @valueChanged="updateCredentialValue"
      />
    </div>
    <div v-else>
      <Banner
        v-if="!credentialId"
        label="First you need to pick or create the cloud credential that will be used to create the nodes for the cluster..."
        color="info"
      />

      <LabeledSelect
        v-model:value="credentialId"
        :label="t('cluster.credential.label')"
        :options="options"
        option-key="value"
        :mode="mode"
        :selectable="option => !option.disabled"
        data-testid="cluster-prov-select-credential"
      />
    </div>

    <template
      v-if="isNew && options.length"
      #footer-prefix
    >
      <button
        class="btn role-secondary"
        @click="backToExisting()"
      >
        {{ t('cluster.credential.selectExisting.label') }}
      </button>
    </template>

    <template
      v-if="isPicked"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang='scss' scoped>
  .select-credentials {
    flex-grow: 1; // Do grow when on own
    &__showingForm {
      flex-grow: 0; // Don't grow when in rke2 form
    }
  }
</style>
