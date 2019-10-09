<script>
import { _EDIT } from '../../../config/query-params';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';

export default {
  name: 'CruService',

  components: {
    NameNsDescription,
    Footer,
  },

  mixins:     [CreateEditView],
};
</script>

<template>
  <form>
    <NameNsDescription
      :value="value"
      :mode="mode"
      name-label="Service Name"
    />

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
