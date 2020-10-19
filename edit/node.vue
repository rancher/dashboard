<script>
import Labels from '@/components/form/Labels';
import Taints from '@/components/form/Taints';
import Footer from '@/components/form/Footer';
import CreateEditView from '@/mixins/create-edit-view';
import { DESCRIPTION, HOSTNAME } from '@/config/labels-annotations';
import NameNsDescription from '@/components/form/NameNsDescription';

export default {
  name: 'EditNode',

  components: {
    Footer, Labels, NameNsDescription, Taints
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      DESCRIPTION,
      HOSTNAME,
      metrics: { cpu: 0, memory: 0 }
    };
  },
};
</script>

<template>
  <div class="node">
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :mode="mode"
      label="Name"
    />
    <div class="row">
      <Labels :value="value" :mode="mode" :display-side-by-side="true" />
    </div>
    <div class="row">
      <Taints v-model="value.spec.taints" :mode="mode" />
    </div>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
</template>

<style lang="scss" scoped>
</style>
