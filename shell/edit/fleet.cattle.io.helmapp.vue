<script>
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import FormValidation from '@shell/mixins/form-validation';

export default {
  name: 'CruHelmApp',

  inheritAttrs: false,

  emits: ['input'],

  components: { Loading },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
  },

  data() {
    return {};
  },

  computed: { ...mapGetters(['workspace']) },

  watch: {},

  created() {
  },

  methods: {}
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <span v-else> Create HelmApp </span>
</template>

<style lang="scss" scoped>
</style>
