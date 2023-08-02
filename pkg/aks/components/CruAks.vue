<script lang='ts'>
import { _CREATE } from '@shell/config/query-params';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';

export default {
  components: { SelectCredential },
  props:      {
    mode: {
      type:    String,
      default: _CREATE
    },
  },
  data() {
    return { credentialId: '' };
  },
  computed: {
    needCredential() {
      return true;
    },

    showForm() {
      return this.credentialId;
    }
  },
  methods: {
    cancelCredential() {
      console.log('AKS cancel credential');
    }
  }
};
</script>

<template>
  <div>
    <SelectCredential
      v-if="needCredential"
      v-model="credentialId"
      :mode="mode"
      provider="azure"
      :cancel="cancelCredential"
      :showing-form="true"
      class="mt-20"
    />
    <div v-if="showForm">
      aks form go here
    </div>
  </div>
</template>
