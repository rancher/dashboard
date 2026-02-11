<script>
import ArrayList from '@shell/components/form/ArrayList';
import Row from './ProjectRow';
import { QUOTA_COMPUTED, TYPES } from './shared';
import Banner from '@components/Banner/Banner.vue';

export default {
  emits: ['remove', 'input'],

  components: {
    ArrayList,
    Row,
    Banner,
  },

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
    return { typeValues: null };
  },

  created() {
    this.value['spec'] = this.value.spec || {};
    this.value.spec['namespaceDefaultResourceQuota'] = this.value.spec.namespaceDefaultResourceQuota || { limit: {} };
    this.value.spec['resourceQuota'] = this.value.spec.resourceQuota || { limit: {} };

    const limit = this.value.spec.resourceQuota.limit;
    const extendedKeys = Object.keys(limit.extended || {});

    this.typeValues = Object.keys(limit).flatMap((k) => {
      if (k !== TYPES.EXTENDED) {
        return k;
      }

      return extendedKeys.map((ek) => `extended.${ ek }`);
    });
  },

  computed: { ...QUOTA_COMPUTED },

  methods: {
    updateType(event) {
      const { index, type } = event;

      this.typeValues[index] = type;
    },
    remainingTypes(currentType) {
      return this.mappedTypes
        .filter((mappedType) => {
          if (mappedType.value === TYPES.EXTENDED) {
            return true;
          }

          return !this.typeValues.includes(mappedType.value) || mappedType.value === currentType;
        });
    },
    emitRemove(data) {
      this.$emit('remove', data.row?.value);
    }
  },
};
</script>
<template>
  <div>
    <Banner
      color="info"
      label-key="resourceQuota.banner"
      class="mb-20"
    />
    <div class="headers mb-10">
      <div class="mr-10">
        <label>
          {{ t('resourceQuota.headers.resourceType') }}
          <span
            class="required mr-5"
            aria-hidden="true"
          >*</span>
        </label>
      </div>
      <div class="mr-20">
        <label>
          {{ t('resourceQuota.headers.resourceIdentifier') }}
          <span
            class="required mr-5"
            aria-hidden="true"
          >*</span>
          <i
            v-clean-tooltip="t('resourceQuota.resourceIdentifier.tooltip')"
            class="icon icon-info"
          />
        </label>
      </div>
      <div class="mr-20">
        <label>{{ t('resourceQuota.headers.projectLimit') }}</label>
      </div>
      <div class="mr-10">
        <label>{{ t('resourceQuota.headers.namespaceDefaultLimit') }}</label>
      </div>
    </div>
    <ArrayList
      v-model:value="typeValues"
      label="Resources"
      :add-label="t('resourceQuota.add.label')"
      :default-add-value="remainingTypes()[0] ? remainingTypes()[0].value : ''"
      :add-allowed="remainingTypes().length > 0"
      :mode="mode"
      @remove="emitRemove"
    >
      <template #columns="props">
        <Row
          :value="value"
          :mode="mode"
          :types="remainingTypes(typeValues[props.i])"
          :type="typeValues[props.i]"
          :index="props.i"
          @input="$emit('input', $event)"
          @type-change="updateType($event)"
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

.required {
  color: var(--error);
}
</style>
