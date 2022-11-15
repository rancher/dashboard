<script>
import ArrayList from '@shell/components/form/ArrayList';
import Row from './ProjectRow';
import { QUOTA_COMPUTED } from './shared';

export default {
  components: { ArrayList, Row },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    types: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'namespaceDefaultResourceQuota', this.value.spec.namespaceDefaultResourceQuota || { limit: {} });
    this.$set(this.value.spec, 'resourceQuota', this.value.spec.resourceQuota || { limit: {} });

    return { typeValues: Object.keys(this.value.spec.resourceQuota.limit) };
  },

  computed: { ...QUOTA_COMPUTED },

  methods: {
    updateType(i, type) {
      this.$set(this.typeValues, i, type);
    },
    remainingTypes(currentType) {
      return this.mappedTypes
        .filter(mappedType => !this.typeValues.includes(mappedType.value) || mappedType.value === currentType);
    },
    emitRemove(data) {
      this.$emit('remove', data.row?.value);
    }
  },
};
</script>
<template>
  <div>
    <div class="headers mb-10">
      <div class="mr-10">
        <label>{{ t('resourceQuota.headers.resourceType') }}</label>
      </div>
      <div class="mr-20">
        <label>{{ t('resourceQuota.headers.projectLimit') }}</label>
      </div>
      <div class="mr-10">
        <label>{{ t('resourceQuota.headers.namespaceDefaultLimit') }}</label>
      </div>
    </div>
    <ArrayList
      v-model="typeValues"
      label="Resources"
      :add-label="t('resourceQuota.add.label')"
      :default-add-value="remainingTypes()[0] ? remainingTypes()[0].value : ''"
      :add-allowed="remainingTypes().length > 0"
      :mode="mode"
      @remove="emitRemove"
    >
      <template #columns="props">
        <Row
          v-model="value"
          :mode="mode"
          :types="remainingTypes(typeValues[props.i])"
          :type="typeValues[props.i]"
          @type-change="updateType(props.i, $event)"
        />
      </template>
    </ArrayList>
  </div>
</template>
<style lang="scss" scoped>
.headers {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    border-bottom: 1px solid var(--border);
    height: 30px;
    width: calc(100% - 75px);

    div {
        width: 100%;
    }
}
</style>
