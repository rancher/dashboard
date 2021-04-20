<script>

import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import { _EDIT } from '@/config/query-params';
import { importMachineConfig } from '@/utils/dynamic-importer';

export default {

  components: {
    LabeledInput,
    Checkbox,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    credentialId: {
      type:     String,
      required: true,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    provider: {
      type:     String,
      required: true,
    },
  },

  computed: {
    configComponent() {
      return importMachineConfig(this.provider);
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput v-model="value.pool.name" label="Pool Name" :required="true" />
      </div>
      <div class="col span-2">
        <LabeledInput v-model="value.pool.quantity" label="Node Count" type="number" min="0" :required="true" />
      </div>
      <div class="col span-6 pt-5">
        <h3>Roles</h3>
        <Checkbox v-model="value.pool.etcdRole" label="etcd" />
        <Checkbox v-model="value.pool.controlPlaneRole" label="Control Plane" />
        <Checkbox v-model="value.pool.workerRole" label="Worker" />
      </div>
    </div>

    <component
      :is="configComponent"
      :mode="mode"
      :value="value.config"
      :credential-id="credentialId"
      @error="e=>errors = e"
    />
  </div>
</template>
