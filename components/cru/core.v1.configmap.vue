<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import AsyncButton from '@/components/AsyncButton';
import KeyValue from '@/components/form/KeyValue';
import { NAMESPACE } from '~/config/types';
import { _CREATE, _VIEW } from '~/config/query-params';

export default {
  name: 'CruConfigMap',

  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,
    AsyncButton,
  },
  mixins:     [CreateEditView],

  computed: {
    namespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      return choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    },

    onlyForCreate() {
      if ( this.mode === _CREATE ) {
        return _CREATE;
      }

      return _VIEW;
    }
  },
};
</script>

<template>
  <form>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.metadata.name"
          :mode="onlyForCreate"
          label="Config Map Name"
          placeholder="Placeholder"
          :required="true"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.metadata.namespace"
          :mode="onlyForCreate"
          :options="namespaces"
          label="Namespace"
          placeholder="Select a namespace"
          :required="true"
        />
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col span-12">
        <KeyValue
          v-model="value.data"
          :mode="mode"
          title="Data"
          :inital-empty-row="true"
        />
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col span-12">
        <KeyValue
          v-model="value.binaryData"
          title="Binary Data"
          :protip="false"
          :add-allowed="false"
          :read-accept="'*'"
          :read-multiple="true"
          :value-binary="true"
          :value-base64="true"
          :value-can-be-empty="true"
          :inital-empty-row="false"
        />
      </div>
    </div>

    <hr />

    <AsyncButton v-if="isEdit" key="edit" mode="edit" @click="save" />
    <AsyncButton v-if="isCreate" key="create" mode="create" @click="save" />
    <button v-if="!isView" class="btn bg-transparent" @click="done">
      Cancel
    </button>
  </form>
</template>
