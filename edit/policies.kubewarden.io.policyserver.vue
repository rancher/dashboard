<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import createEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import { mapGetters } from 'vuex';
import { KUBEWARDEN } from '@/config/types';
import { random32 } from '@/utils/string';

export default {
  components: {
    NameNsDescription,
    LabeledInput,
    CruResource
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
    }
  },

  async fetch() {
    this.allPolicies = await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.POLICY_SERVER });
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', {});
    }

    if (!this.value.status) {
      this.$set(this.value, 'status', {});
      this.$set(this.value.status, 'conditions', []);
    }

    return {
      allPolicies: [], name: this.value.metadata.name, conditions: [...this.value.status.conditions]
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
      const idx = this.conditions.indexOf(row);

      this.conditions.splice(idx, 1);
      this.update();
    },

    addCondition() {
      this.conditions.push({ vKey: random32() });
    },

    update() {
      this.$emit('input', this.value);
    },
  }
};
</script>

<template>
  <div>
    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :errors="errors"
      @finish="save"
      @error="e=>errors = e"
    >
      <template>
        <div class="spacer"></div>
        <div class="row">
          <div class="col span-12">
            <NameNsDescription :mode="mode" :value="value" :namespaced="false" @change="name=value.metadata.name" />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledInput v-model="value.spec.image" :mode="mode" label="Image" />
          </div>
        </div>
        <div class="spacer" />

        <div v-for="condition in conditions" :key="condition.vKey" class="condition">
          <div class="col">
            <LabeledInput v-model="condition.type" :mode="mode" label="Type" />
          </div>

          <div class="col">
            <button
              v-if="!isView"
              type="button"
              class="btn role-link"
              :disabled="mode==='view'"
              @click="remove(condition)"
            >
              <t k="generic.remove" />
            </button>
          </div>
        </div>
        <button v-if="!isView" type="button" class="btn role-tertiary" @click="addCondition">
          Add Condition
        </button>
      </template>
    </CruResource>
  </div>
</template>

<style lang='scss' scoped>
.condition {
  display: grid;
  grid-template-columns: 40% 10% 40% 10%;
  grid-gap: $column-gutter;
  align-items: center;
  margin-bottom: 20px;
  .col {
    height: 100%;
  }
}
</style>
