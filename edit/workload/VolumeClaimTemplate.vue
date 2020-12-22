<script>
import Mount from '@/edit/workload/storage/Mount';
import { mapGetters } from 'vuex';
import PersistentVolumeClaim from '@/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim.vue';
import { PVC } from '@/config/types';
import { _VIEW } from '@/config/query-params';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';

export default {
  components: {
    ArrayListGrouped,
    Mount,
    PersistentVolumeClaim
  },

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    String,
      default: null
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  data() {
    return { templates: this.value.volumeClaimTemplates, name: '' };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    namespace(neu) {
      this.pvc.metadata.namespace = neu;
    },
  },

  methods: {
    update() {
      this.$set(this.value, 'volumeClaimTemplates', this.templates);
    },

    updatePVC(pvc) {
      const storage = pvc?.spec?.resources?.requests?.storage;

      if (storage) {
        if (!storage.toString().match(/[0-9]*[a-zA-Z]+$/)) {
          pvc.spec.resources.requests.storage += 'Gi';
        }
      }
      this.name = pvc?.metadata?.name;
      this.update();
    },

    addPVC() {
      if (!this.value.volumeClaimTemplates) {
        this.$set(this.value, 'volumeClaimTemplates', []);
      }
      this.templates = this.value.volumeClaimTemplates;

      const namespace = this.namespace || this.$store.getters['defaultNamespace'];

      const data = { type: PVC };

      data.metadata = { namespace };

      this.$store.dispatch('cluster/create', data).then((pvc) => {
        pvc.applyDefaults();
        this.templates.push(pvc);
        this.update();
      });
    },
  }
};
</script>

<template>
  <div>
    <div>
      <ArrayListGrouped v-model="templates" class="mb-20" @input="update()">
        <template #default="props">
          <div class="bordered-section">
            <PersistentVolumeClaim v-if="props.row.value.metadata" :value="props.row.value" :mode="mode" @input="updatePVC(props.row.value)" />
          </div>
          <Mount :pod-spec="value.template.spec" :name="props.row.value.metadata.name" :mode="mode" />
        </template>
        <template #add>
          <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addPVC">
            Add Claim Template
          </button>
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.remove-btn{
  position: absolute;
  top:0px;
  right:0px;
}
</style>
