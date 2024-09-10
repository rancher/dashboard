<script>
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import { LabeledInput } from '@components/Form/LabeledInput';
import { NORMAN } from '@shell/config/types';
export default {
  components: {
    CruResource,
    Loading,
    LabeledInput
  },
  inheritAttrs: false,
  mixins:       [createEditView],
  props:        {
    value: {
      type:     Object,
      required: true,
    },
  },
  async fetch() {
    // we need this to populate the NORMAN node... getNorman
    await this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
  },
  data() {
    return {
      name:    '',
      loading: true
    };
  },
  methods: {
    async save(saveCb) {
      try {
        this.value.norman.name = this.name;
        await this.value.norman.save();

        saveCb(true);

        this.done();
      } catch (error) {
        this.errors.push(error);
        saveCb(false);
      }
    },
  },
  mounted() {
    this.name = this.value.spec.displayName;
  },
  computed: {
    doneLocationOverride() {
      return this.value.doneOverride;
    },
  },
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
  >
    <LabeledInput
      v-model:value="name"
      :label="t('managementNode.customName')"
      :mode="mode"
    />
  </CruResource>
</template>
