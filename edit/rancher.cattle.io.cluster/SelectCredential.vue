<script>
import Loading from '@/components/Loading';
import LabeledSelect from '@/components/form/LabeledSelect';
import { SECRET } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import Banner from '@/components/Banner';

const _NEW = '_NEW';
const _NONE = '_NONE';

export default {
  components: { Loading, LabeledSelect, CruResource, NameNsDescription, Banner},

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
      type: Function,
      required: true,
    }
  },

  async fetch() {
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });

    this.newCredential = await this.$store.dispatch('management/create', {
      type:     SECRET,
      metadata: {
        annotations: {
          provider: this.provider,
        }
      },
      data:     {},
    });
  },

  data() {
    return {
      allSecrets:    null,
      nodeComponent: null,
      credentialId:  this.value || _NONE,
      newCredential: null,
      createValidationPassed: false,
    };
  },

  computed: {
    isNone() {
      return this.credentialId === null || this.credentialId === _NONE;
    },

    isNew() {
      return this.credentialId === _NEW;
    },

    isPicked() {
      return !!this.credentialId && !this.isNone && !this.isNew;
    },

    options() {
      // @TODO better thing to filter secrets by, limit to matching provider
      const out = this.allSecrets.filter((obj) => {
        return obj.metadata.annotations?.provider === this.provider;
      }).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });

      if ( out.length ) {
        out.unshift({
          label: 'Create new...',
          value: _NEW,
        });

        out.unshift({
          label:    'Select a credential...',
          value:    _NONE,
          disabled: true,
        });
      }

      return out;
    },

    createComponent() {
      return () => import(`./credential/${this.provider}`);
    },

    validationPassed() {
      if ( this.credentialId === _NONE ) {
        return false;
      }

      if ( this.credentialId === _NEW ) {
          return this.createValidationPassed;
      }

      return !!this.credentialId;
    },
  },

  methods: {
    async save(btnCb) {
      if ( typeof this.$refs.create?.test === 'function' ) {
        try {
          const res = await this.$refs.create.test();
          if ( !res ) {
            this.errors = ['Authentication test failed, please check your credentials'];
            btnCb(false)
            return;
          }
        } catch (e) {
          this.errors = [e];
          btnCb(false)
        }
      }

      if ( this.newCredential.metadata.name ) {
        delete this.newCredential.metadata.generateName;
      } else {
        this.newCredential.metata.generateName = GENERATE_NAME;
      }

      try {
        const res = await this.newCredential.save();
        this.credentialId = res.id;
        btnCb(true);
      } catch (e) {
        this.errors = [e];
        btnCb(false);
      }
    },

    createValidationChanged(passed) {
      this.createValidationPassed = passed;
    },

    backToExisting() {
      this.credentialId = _NONE;
    }
  },

  watch: {
    credentialId(val) {
      if ( val === _NEW || val === _NONE ) {
        this.$emit('input', null);
      } else {
        this.$emit('input', val);
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
    :validation-passed="validationPassed"
    :resource="newCredential"
    :can-yaml="false"
    :cancel-event="true"
    :errors="errors"
    @finish="save"
    @cancel="cancel"
    @error="e=>errors = e"
    finish-button-mode="continue"
  >
    <div v-if="isNew || !options.length">
      <Banner label="Ok, Let's create a new credential" color="info"/>

      <NameNsDescription
        v-model="newCredential"
        :namespaced="true"
        :description-hidden="true"
        name-label='cluster.credential.name.label'
        name-placeholder='cluster.credential.name.placeholder'
        :name-required="false"
        :mode="mode"
      />

      <component
        :is="createComponent"
        ref="create"
        @validationChanged="createValidationChanged"
        v-model="newCredential"
      />
      After
    </div>
    <div v-else>
      <Banner v-if="!credentialId" label="First you need to pick or create the cloud credential that will be used to create the nodes for the cluster..." color="info"/>

      <LabeledSelect
        v-model="credentialId"
        :label="t('cluster.credential.label')"
        :options="options"
        :mode="mode"
        :selectable="option => !option.disabled"
      />
    </div>

    <template #footer-prefix v-if="isNew">
      <button class="btn role-secondary" @click="backToExisting()">Select Existing</button>
    </template>

    <template v-if="isPicked" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
