<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import createEditView from '@/mixins/create-edit-view';
import { mapGetters } from 'vuex';
import { KUBEWARDEN } from '@/config/types';
import { random32 } from '@/utils/string';

export default {
  components: {
    NameNsDescription,
    LabeledInput,
  },

  mixins: [createEditView],

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    },
    resource: {
      type:    String,
      default: null
    }
  },

  // ************************************************************
  //
  // /k8s/clusters/c-m-j4q2k9hm/v1/schemas/policies.kubewarden.io.clusteradmissionpolicy
  // /k8s/clusters/c-m-j4q2k9hm/v1/schemas/policies.kubewarden.io.v1alpha2.clusteradmissionpolicy.spec
  // /k8s/clusters/c-m-j4q2k9hm/v1/schemas/policies.kubewarden.io.v1alpha2.clusteradmissionpolicy.rules
  //
  // ************************************************************

  async fetch() {
    this.allPolicies = await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY });
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', {});
    }

    if (!this.value.spec.rules) {
      this.$set(this.value.spec, 'rules', []);
    }

    return {
      allPolicies: [], name: this.value.metadata.name, rules: [...this.value.spec.rules]
    };
  },

  computed: {
    ...mapGetters({ currentCluster: 'currentCluster', t: 'i18n/t' }),

    provider() {
      return this.currentCluster.status.provider;
    },
  },

  methods: {
    remove(row) {
      const idx = this.rules.indexOf(row);

      this.rules.splice(idx, 1);
      this.update();
    },

    addRule() {
      this.rules.push({ vKey: random32() });
    },

    update() {
      this.$emit('input', this.value);
    },
  }
};
</script>

<template>
  <div>
    <h3>{{ resource }}</h3>
    <template>
      <div class="spacer"></div>
      <div class="row">
        <div class="col span-12">
          <NameNsDescription :mode="mode" :value="value" :namespaced="false" @change="name=value.metadata.name" />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="value.spec.module" :mode="mode" label="Module" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.spec.policyServer" :mode="mode" label="Policy Server" />
        </div>
      </div>
      <div class="spacer" />

      <div v-for="rule in rules" :key="rule.vKey" class="rule">
        <div class="col">
          <LabeledInput v-model="rule.apiGroups" :mode="mode" label="API Groups" />
        </div>
        <div class="col">
          <LabeledInput v-model="rule.apiVersions" :mode="mode" label="API Versions" />
        </div>
        <div class="col">
          <LabeledInput v-model="rule.operations" :mode="mode" label="Operations" />
        </div>
        <div class="col">
          <LabeledInput v-model="rule.resources" :mode="mode" label="Resources" />
        </div>
        <div class="col">
          <button
            v-if="!isView"
            type="button"
            class="btn role-link"
            :disabled="mode==='view'"
            @click="remove(rule)"
          >
            <t k="generic.remove" />
          </button>
        </div>
      </div>
      <button v-if="!isView" type="button" class="btn role-tertiary" @click="addRule">
        Add Rule
      </button>
    </template>
  </div>
</template>

<style lang='scss' scoped>
.rule {
  display: grid;
  grid-template-columns: 20% 10% 20% 10% 20% 10%;
  grid-gap: $column-gutter;
  align-items: center;
  margin-bottom: 20px;
  .col {
    height: 100%;
  }
}
</style>
