<script>
import { mapGetters } from 'vuex';
import { random32 } from '@/utils/string';
import { _CREATE, _VIEW } from '@/config/query-params';
import createEditView from '@/mixins/create-edit-view';

import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import CruResource from '@/components/CruResource';

export default {
  components: {
    NameNsDescription,
    LabeledInput,
    CruResource
  },

  mixins: [createEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: _CREATE
    }
  },

  data() {
    if ( !this.value.spec ) {
      this.$set(this.value, 'spec', {});
    }

    if ( !this.value.status ) {
      this.$set(this.value, 'status', {});
      this.$set(this.value.status, 'conditions', []);
    }

    return { conditions: [...this.value.status.conditions] };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ t: 'i18n/t' }),

    isView() {
      return this.mode === _VIEW;
    },

    provider() {
      return this.currentCluster?.status?.provider;
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
      @error="e => errors = e"
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
