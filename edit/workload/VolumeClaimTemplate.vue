<script>
import Mount from '@/edit/workload/storage/Mount';
import InfoBox from '@/components/InfoBox';
import { mapGetters } from 'vuex';
import PersistentVolumeClaim from '@/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim.vue';
import { PVC } from '@/config/types';
import { removeObject } from '@/utils/array';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    Mount,
    PersistentVolumeClaim,
    InfoBox
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

    removePVC(pvc) {
      removeObject(this.templates, pvc);
      this.update();
    }
  }
};
</script>

<template>
  <div>
    <div>
      <InfoBox v-for="(pvc, i) in templates" :key="i" class="mb-20" :style="{'position':'relative'}">
        <button v-if="!isView" type="button" class="role-link btn remove-btn" @click="removePVC(pvc)">
          <i class="icon icon-2x icon-x" />
        </button>
        <div class="bordered-section">
          <PersistentVolumeClaim v-if="pvc.metadata" :value="pvc" :mode="mode" @input="updatePVC(pvc)" />
        </div>
        <Mount :pod-spec="value.template.spec" :name="pvc.metadata.name" :mode="mode" />
      </InfoBox>
      <button v-if="!isView" type="button" class="btn role-secondary" @click="addPVC">
        Add Claim Template
      </button>
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
