<script>
import { mapGetters } from 'vuex';
import { _VIEW } from '@/config/query-params';
import createEditView from '@/mixins/create-edit-view';

import LabeledInput from '@/components/form/LabeledInput';
import NameNsDescription from '@/components/form/NameNsDescription';
import ShellInput from '~/components/form/ShellInput';

export default {
  components: {
    LabeledInput,
    NameNsDescription,
    ShellInput,
  },

  mixins: [createEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: _VIEW
    },
  },

  data() {
    if ( !this.value.spec ) {
      this.$set(this.value, 'spec', {});
    }

    if ( !this.value.spec.rules ) {
      this.$set(this.value.spec, 'rules', []);
    }

    return { rules: [...this.value.spec.rules] };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ t: 'i18n/t' }),

    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    update() {
      this.$emit('input', this.value);
    },
  }
};
</script>

<template>
  <div>
    <template>
      <div class="spacer"></div>
      <div class="row">
        <div class="col span-12">
          <NameNsDescription :mode="mode" :value="value" :namespaced="false" />
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
          <ShellInput v-model="rule.apiGroups" :mode="mode" label="API Groups" />
        </div>
        <div class="col">
          <ShellInput v-model="rule.apiVersions" :mode="mode" label="API Versions" />
        </div>
        <div class="col">
          <ShellInput v-model="rule.operations" :mode="mode" label="Operations" />
        </div>
        <div class="col">
          <ShellInput v-model="rule.resources" :mode="mode" label="Resources" />
        </div>
      </div>
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
