<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import { MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';
import ClusterPermissionsEditor from '@/components/form/Members/ClusterPermissionsEditor';

export default {
  components: {
    ClusterPermissionsEditor,
    CruResource,
    Loading,
  },

  mixins: [CreateEditView],
  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });
    this.roleTemplates = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE });
  },
  data() {
    return { bindings: [] };
  },
  computed: {
    doneLocationOverride() {
      return this.value.listLocation;
    },
  },
  methods: {
    async saveOverride() {
      await Promise.all(this.bindings.map(binding => binding.save()));

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
    <ClusterPermissionsEditor v-model="bindings" :cluster-name="$store.getters['currentCluster'].id" />
  </CruResource>
</template>
