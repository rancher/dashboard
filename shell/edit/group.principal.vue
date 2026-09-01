<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import GlobalRoleBindings from '@shell/components/GlobalRoleBindings.vue';
import CruResource from '@shell/components/CruResource';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NORMAN } from '@shell/config/types';

export default {
  components: {
    GlobalRoleBindings,
    CruResource
  },
  mixins: [CreateEditView],
  data() {
    return {
      errors: [],
      valid:  false,
    };
  },
  methods: {
    async save(buttonDone) {
      this.errors = [];

      try {
        await this.$refs.grb.save();

        await this.$store.dispatch('management/findAll', {
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL,
          opt:  { force: true }
        }, { root: true }); // See PromptRemove.vue

        this.$router.replace({ name: this.doneRoute });
        buttonDone(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
  }
};
</script>

<template>
  <div>
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="valid"
      :errors="errors"
      :can-yaml="false"
      @finish="save"
    >
      <GlobalRoleBindings
        ref="grb"
        :group-principal-id="value.id"
        :mode="mode"
        @canLogIn="valid = $event"
      />
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
</style>
