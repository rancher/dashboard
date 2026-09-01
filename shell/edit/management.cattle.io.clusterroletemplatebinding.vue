<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import ClusterPermissionsEditor from '@shell/components/form/Members/ClusterPermissionsEditor';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  components: {
    ClusterPermissionsEditor,
    CruResource,
    Loading,
  },
  inheritAttrs: false,

  mixins: [CreateEditView],
  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });
    this.roleTemplates = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE });
  },
  data() {
    return { bindings: [], errors: [] };
  },
  computed: {
    doneLocationOverride() {
      return this.value.listLocation;
    },
  },
  methods: {
    async saveOverride(btnCb) {
      this.errors = [];
      try {
        await Promise.all(this.bindings.map((binding) => binding.save()));

        btnCb(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);

        return;
      }

      this.$router.replace(this.value.listLocation);
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="cluster-role-template-binding"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :validation-passed="bindings.length > 0"
    @error="e=>errors = e"
    @finish="saveOverride"
    @cancel="done"
  >
    <ClusterPermissionsEditor
      v-model:value="bindings"
      :cluster-name="$store.getters['currentCluster'].id"
    />
  </CruResource>
</template>
