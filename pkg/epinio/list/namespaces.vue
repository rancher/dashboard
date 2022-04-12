<script>
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@shell/components/Banner';
import Card from '@shell/components/Card';
import { mapGetters, mapState } from 'vuex';
import LabeledInput from '@shell/components/form/LabeledInput.vue';
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
      errors:           [],
      validFields:     { name: false },
      value:           { name: '' },
      submitted:       false,
      mode:            _CREATE
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    validationPassed() {
      return !Object.values(this.validFields).includes(false);
    },
    ...mapState('action-menu', ['showPromptRemove']),
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
    }
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
    },
    async onSubmit(buttonCb) {
      try {
        await this.value.save();
        this.closeCreateModal();
        buttonCb(true);
      } catch (e) {
        this.errors = epinioExceptionToErrorsArray(e);
        buttonCb(false);
      }
    },
    meetsNameRequirements( name = '') {
      const nameErrors = validateKubernetesName(name, this.t('epinio.namespace.name'), this.$store.getters, undefined, []);

      if (nameErrors.length > 0) {
        return {
          isValid:      false,
          errorMessage: nameErrors.join(', ')
        };
      }

      return { isValid: true };
    },

    setValid(field, valid) {
      this.validFields[field] = valid;
    },
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="'undefined'"
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
    <div v-if="showCreateModal" class="modal">
      <Card
        class="modal-content"
        :show-actions="true"
      >
        <h4 slot="title" v-html="t('epinio.namespace.create')" />
        <div slot="body" class="model-body">
          <LabeledInput
            ref="namespaceName"
            v-model="value.name"
            :label="t('epinio.namespace.name')"
            :mode="mode"
            :required="true"
            :validators="[ meetsNameRequirements ]"
            @setValid="setValid('name', $event)"
          />
          <Banner v-for="(err, i) in errors" :key="i" color="error" :label="JSON.stringify(err)" />
        </div>

        <div slot="actions">
          <button class="btn role-secondary" @click="closeCreateModal">
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
}

.modal-content {
  background-color: var(--default);
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 60%;

  .model-body {
    min-height: 90px;
  }

}

</style>
