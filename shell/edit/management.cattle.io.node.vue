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
  mixins: [createEditView],
  props:  {
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

        // navigate back to the area we came from
        this.$router.go(-1);
      } catch (error) {
        this.errors.push(error);
        saveCb(false);
      }
    },
    overrideCancel() {
      this.$router.go(-1);
    },
  },
  mounted() {
    this.name = this.value.spec.displayName;
  }
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :resource="value"
    :mode="mode"
    :errors="errors"
    :cancel-event="true"
    @finish="save"
    @cancel="overrideCancel"
  >
    <LabeledInput
      v-model="name"
      :label="t('managementNode.customName')"
      :mode="mode"
    />
  </CruResource>
</template>
