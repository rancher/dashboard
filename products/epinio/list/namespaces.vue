<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import Card from '@/components/Card';
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput.vue';
import { validateKubernetesName } from '@/utils/validators/kubernetes-name';
import AsyncButton from '@/components/AsyncButton';
import { _CREATE } from '@/config/query-params';
import { EPINIO_TYPES } from '@/products/epinio/types';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  name:       'EpinioNamespaceList',
  components: {
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
    }
  },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
  },
  methods: {
    async openCreateModal() {
      this.showCreateModal = true;
      // Create a skeleton namespace
      this.value = await this.$store.dispatch(`epinio/create`, { type: EPINIO_TYPES.NAMESPACE });
    },
    closeCreateModal() {
      this.showCreateModal = false;
    },
    onSubmit() {
      try {
        this.value.save();
        this.close();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }
      this.closeCreateModal();
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
          Create
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
    <div v-show="showCreateModal" class="modal">
      <Card
        class="modal-content"
        :show-actions="true"
      >
        <span class="close" @click="closeCreateModal">&times;</span>
        <h4 slot="title" v-html="t('epinio.namespace.create')" />
        <div slot="body">
          <LabeledInput
            v-model="value.name"
            :min-height="'100px'"
            :label="t('epinio.namespace.name')"
            :mode="mode"
            :required="true"
            :validators="[ meetsNameRequirements ]"
            @setValid="setValid('name', $event)"
          />
        </div>
        <Banner v-for="(err, i) in errors" :key="i" color="error" :label="JSON.stringify(err)" />

        <div slot="actions">
          <button class="btn role-secondary" @click="closeCreateModal">
            Cancel
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
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.right-align {
    float: right;
}

.margin-left {
    margin-left: 10px;
}
</style>
