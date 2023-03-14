<script>
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import { mapGetters, mapState } from 'vuex';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';
import AsyncButton from '@shell/components/AsyncButton';
import { _CREATE } from '@shell/config/query-params';
import { EPINIO_TYPES } from '../types';
import { epinioExceptionToErrorsArray } from '../utils/errors';

export default {
  name: 'EpinioNamespaceList',

  components: {
    Banner,
    ResourceTable,
    Masthead,
    Card,
    LabeledInput,
    AsyncButton
  },

  data() {
    return {
      showCreateModal: false,
      errors:          [],
      validFields:     { name: false },
      value:           { meta: { name: '' } },
      submitted:       false,
      mode:            _CREATE,
      touched:         false,
      resource:        EPINIO_TYPES.NAMESPACE
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    ...mapState('action-menu', ['showPromptRemove']),

    validationPassed() {
      /**
       * Add here fields that need validation
       */
      const errors = this.getNamespaceErrors(this.value.meta.name);

      return errors?.length === 0;
    },
  },
  mounted() {
    // Opens the create namespace modal if the query is passed as query param
    if (this.$route.query.mode === 'openModal') {
      this.openCreateModal();
    }
  },
  props: {
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
  },

  watch: {
    showPromptRemove(oldState, newState) {
      if (oldState === true && newState === false) {
        // Refetch apps when namespace is deleted
        this.$store.dispatch('findAll', { type: 'applications', opt: { force: true } });
      }
    },

    'value.meta.name': 'validateNamespace',
  },

  methods: {
    async openCreateModal() {
      this.showCreateModal = true;
      // Focus on the name input field... after it's been displayed
      this.$nextTick(() => this.$refs.namespaceName.focus());
      // Create a skeleton namespace
      this.value = await this.$store.dispatch(`epinio/create`, { type: EPINIO_TYPES.NAMESPACE });
    },

    closeCreateModal() {
      this.showCreateModal = false;
      this.errors = [];
      this.touched = false;
    },

    async onSubmit(buttonCb) {
      try {
        await this.value.create();
        this.closeCreateModal();
        buttonCb(true);
      } catch (e) {
        this.errors = epinioExceptionToErrorsArray(e).map(JSON.stringify);
        buttonCb(false);
      }
    },

    validateNamespace(name) {
      if (!name?.length && !this.touched) {
        this.touched = true;
      }

      this.errors = this.getNamespaceErrors(name);
    },

    getNamespaceErrors(name) {
      const kubernetesErrors = validateKubernetesName(name || '', this.t('epinio.namespace.name'), this.$store.getters, undefined, []);

      if (kubernetesErrors.length) {
        return [kubernetesErrors.join(', ')];
      }

      const validateName = name.match(/[a-z0-9]([-a-z0-9]*[a-z0-9])?/);

      if (!validateName || validateName[0] !== name) {
        return [this.t('epinio.namespace.validations.name')];
      }

      return [];
    }
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
    >
      <template v-slot:createButton>
        <button
          class="btn role-primary"
          @click="openCreateModal"
        >
          {{ t('generic.create') }}
        </button>
      </template>
    </Masthead>
    <ResourceTable
      v-bind="$attrs"
      :rows="rows"
      :groupable="false"
      :schema="schema"
      key-field="_key"
      v-on="$listeners"
    />
    <div
      v-if="showCreateModal"
      class="modal"
    >
      <Card
        class="modal-content"
        :show-actions="true"
      >
        <h4
          slot="title"
          v-html="t('epinio.namespace.create')"
        />
        <div
          slot="body"
          class="model-body"
        >
          <LabeledInput
            ref="namespaceName"
            v-model="value.meta.name"
            :label="t('epinio.namespace.name')"
            :mode="mode"
            :required="true"
          />
          <Banner
            v-for="(err, i) in errors"
            :key="i"
            color="error"
            :label="err"
          />
        </div>

        <div
          slot="actions"
          class="model-actions"
        >
          <button
            class="btn role-secondary mr-10"
            @click="closeCreateModal"
          >
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            :disabled="!validationPassed"
            :mode="mode"
            @click="onSubmit"
          />
        </div>
      </Card>
    </div>
  </div>
</template>

<style lang='scss' scoped>

.modal {
  position: fixed; /* Stay in place */
  z-index: 50; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.4);
  border-radius: var(--border-radius);

  .banner {
    margin-bottom: 0;
  }
}

.modal-content {
  background-color: var(--default);
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 50%;
  max-width: 500px;

  .model-body {
    min-height: 116px;
  }

  .model-actions {
    justify-content: flex-end;
    display: flex;
    flex: 1;
  }

}

</style>
