<script>
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';

const TYPES_WITH_STORAGE_CLASS = ['requestsStorageClassStorage', 'requestsStorageClassPVC'];

export default {
  components: { UnitInput, Select },

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
    },
    storageClasses: {
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
    const quotaLimit = this.value.spec.resourceQuota.limit;
    const nsQuotaLimit = this.value.spec.namespaceDefaultResourceQuota.limit;
    const allTypes = [...new Set([...Object.keys(quotaLimit), ...Object.keys(nsQuotaLimit)])];
    const typeQuotas = allTypes.reduce((t, c) => {
      const limit = quotaLimit[c];
      const nsLimit = nsQuotaLimit[c];

      if (TYPES_WITH_STORAGE_CLASS.includes(c)) {
        const scList = [...new Set([...Object.keys(limit ?? {}), ...Object.keys(nsLimit ?? {})])];

        scList.forEach((sc) => {
          t.push({
            type:    c,
            limit:   { sc, limit: limit[sc] ?? '' },
            nsLimit: { sc, limit: nsLimit[sc] ?? '' }
          });
        });

        return t;
      }

      t.push({
        type:    c,
        limit:   limit ?? '',
        nsLimit: nsLimit ?? '',
      });

      return t;
    }, []);

    return {
      typeQuotas,
      typesWithStorageClass: TYPES_WITH_STORAGE_CLASS,
    };
  },

  computed: {
    mappedTypes() {
      return this.types
        .map(type => ({
          label:       this.t(type.labelKey),
          baseUnit:    type.baseUnitKey ? this.t(type.baseUnitKey) : undefined,
          placeholder: this.t(type.placeholderKey),
          ...type,
        }));
    },
    typeValues() {
      return [...new Set(this.typeQuotas.map(tq => tq.type))];
    },
    typeSCValuesMap() {
      const typeQuotas = this.typeQuotas;

      return TYPES_WITH_STORAGE_CLASS.reduce((t, c) => {
        const quotas = typeQuotas.filter(tq => tq.type === c);

        t[c] = quotas?.map(item => item.limit.sc ?? item.nsLimit.sc) ?? [];

        return t;
      }, {});
    },
    typeOption() {
      return this.mappedTypes.reduce((t, c) => {
        t[c.value] = c;

        return t;
      }, {});
    }
  },
  watch: {
    typeQuotas: {
      handler(v) {
        const nsQuotaLimit = { limit: {} };
        const quotaLimit = { limit: {} };

        v.filter(t => TYPES_WITH_STORAGE_CLASS.includes(t.type) && (t.limit || t.nsLimit))
          .forEach((q) => {
            if (q.nsLimit.limit) {
              const limit = nsQuotaLimit.limit[q.type] ?? {};

              limit[q.nsLimit.sc] = q.nsLimit.limit;
              nsQuotaLimit.limit[q.type] = limit;
            }
            if (q.limit.limit) {
              const limit = quotaLimit.limit[q.type] ?? {};

              limit[q.limit.sc] = q.limit.limit;
              quotaLimit.limit[q.type] = limit;
            }
          });

        v.filter(t => !TYPES_WITH_STORAGE_CLASS.includes(t.type) && (t.limit || t.nsLimit))
          .forEach((q) => {
            if (q.nsLimit) {
              nsQuotaLimit.limit[q.type] = q.nsLimit;
            }
            if (q.limit) {
              quotaLimit.limit[q.type] = q.limit;
            }
          });
        this.value.spec.namespaceDefaultResourceQuota = nsQuotaLimit;
        this.value.spec.resourceQuota = quotaLimit;
      },
      deep: true
    }
  },
  methods: {
    remainingTypes(currentType) {
      const typeValues = this.typeValues;

      return this.mappedTypes
        .filter((mappedType) => {
          if (TYPES_WITH_STORAGE_CLASS.includes(mappedType.value)) {
            const scIds = this.remainingSc(mappedType.value);

            if (typeValues.includes(mappedType.value)) {
              return scIds.length > 0 || mappedType.value === currentType;
            }

            return scIds.length > 0;
          }

          return !typeValues.includes(mappedType.value) || mappedType.value === currentType;
        });
    },
    remainingSc(type, currentSc) {
      const values = this.typeSCValuesMap[type];

      return this.storageClasses
        .filter(sc => !values.includes(sc.id) || sc.id === currentSc)
        .map(sc => ({ label: sc.id, value: sc.id }));
    },

    updateType(type, quota) {
      const { type: oldType } = quota;

      if (type === oldType) {
        return;
      }

      if (TYPES_WITH_STORAGE_CLASS.includes(type)) {
        const sc = this.remainingSc(type)[0]?.value;

        quota.type = type;
        quota.limit = { sc, limit: '' };
        quota.nsLimit = { sc, limit: '' };
      } else {
        quota.type = type;
        quota.limit = '';
        quota.nsLimit = '';
      }
    },
    updateStorageClass(sc, quota) {
      quota.limit.sc = sc;
      quota.nsLimit.sc = sc;
    },
    remove(index, quota) {
      this.typeQuotas.splice(index, 1);
      if (TYPES_WITH_STORAGE_CLASS.includes(quota.type)) {
        const limit = this.value.spec.resourceQuota.limit[quota.type] ?? {};
        const nslimit = this.value.spec.namespaceDefaultResourceQuota.limit[quota.type] ?? {};

        delete limit[quota.limit.sc];
        delete nslimit[quota.nsLimit.sc];

        if (Object.keys(limit).length === 0) {
          delete this.value.spec.resourceQuota.limit[quota.type];
        } else {
          this.value.spec.resourceQuota.limit[quota.type] = limit;
        }
        if (Object.keys(nslimit).length === 0) {
          delete this.value.spec.namespaceDefaultResourceQuota.limit[quota.type];
        } else {
          this.value.spec.namespaceDefaultResourceQuota.limit[quota.type] = nslimit;
        }
      } else {
        delete this.value.spec.resourceQuota.limit[quota.type];
        delete this.value.spec.namespaceDefaultResourceQuota.limit[quota.type];
      }
    },
    add() {
      const type = this.remainingTypes()[0];

      if (type) {
        if (TYPES_WITH_STORAGE_CLASS.includes(type.value)) {
          const sc = this.remainingSc(type.value)[0].value;

          this.typeQuotas.push({
            type:  type.value,
            limit: {
              sc,
              limit: '',
            },
            nsLimit: {
              sc,
              limit: '',
            }
          });
        } else {
          this.typeQuotas.push({
            type:    type.value,
            limit:   '',
            nsLimit: '',
          });
        }
      }
    }
  },
};
</script>
<template>
  <div>
    <div class="project-quota mb-10">
      <div class="headers mb-10">
        <label>{{ t('resourceQuota.headers.resourceType') }}</label>
        <label>{{ t('resourceQuota.headers.projectLimit') }}</label>
        <label>{{ t('resourceQuota.headers.namespaceDefaultLimit') }}</label>
        <div></div>
      </div>

      <div v-for="(tq, index) in typeQuotas" :key="`${tq.type}${tq.limit && tq.limit.sc ? `_${tq.limit.sc}` : ''}`" class="type-row mb-10">
        <template v-if="typesWithStorageClass.includes(tq.type)">
          <div class="type-with-sc">
            <Select :mode="mode" :value="tq.type" :options="remainingTypes(tq.type)" @input="updateType($event, tq)"></Select>
            <Select :mode="mode" :value="tq.limit.sc" :options="remainingSc(tq.type, tq.limit.sc)" @input="updateStorageClass($event, tq)"></Select>
          </div>
          <div>
            <UnitInput
              v-model="tq.limit.limit"
              :mode="mode"
              :placeholder="typeOption[tq.type].placeholder"
              :increment="typeOption[tq.type].increment"
              :input-exponent="typeOption[tq.type].inputExponent"
              :base-unit="typeOption[tq.type].baseUnit"
              :output-modifier="true"
            />
          </div>
          <div>
            <UnitInput
              v-model="tq.nsLimit.limit"
              :mode="mode"
              :placeholder="typeOption[tq.type].placeholder"
              :increment="typeOption[tq.type].increment"
              :input-exponent="typeOption[tq.type].inputExponent"
              :base-unit="typeOption[tq.type].baseUnit"
              :output-modifier="true"
            />
          </div>
        </template>
        <template v-else>
          <Select :mode="mode" :value="tq.type" :options="remainingTypes(tq.type)" @input="updateType($event, tq)"></Select>
          <UnitInput
            v-model="tq.limit"
            :mode="mode"
            :placeholder="typeOption[tq.type].placeholder"
            :increment="typeOption[tq.type].increment"
            :input-exponent="typeOption[tq.type].inputExponent"
            :base-unit="typeOption[tq.type].baseUnit"
            :suffix="typeOption[tq.type].suffix"
            :output-modifier="true"
          />
          <UnitInput
            v-model="tq.nsLimit"
            :mode="mode"
            :placeholder="typeOption[tq.type].placeholder"
            :increment="typeOption[tq.type].increment"
            :input-exponent="typeOption[tq.type].inputExponent"
            :base-unit="typeOption[tq.type].baseUnit"
            :suffix="typeOption[tq.type].suffix"
            :output-modifier="true"
          />
        </template>
        <div>
          <button type="button" :disabled="mode === 'view'" class="btn role-link" @click="remove(index, tq)">
            {{ t('generic.remove') }}
          </button>
        </div>
      </div>
    </div>
    <button v-if="mode !== 'view'" type="button" class="btn role-tertiary add" :disabled="remainingTypes().length === 0" @click="add()">
      {{ t('resourceQuota.add.label') }}
    </button>
  </div>
</template>
<style lang="scss" scoped>
.type-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 75px;
  row-gap: 10px;
  column-gap: 10px;
  align-items: center;
}
.headers {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 75px;
  column-gap: 10px;
  row-gap: 10px;
  border-bottom: 1px solid var(--border);
  grid-column: 1 / 4;
  height: 30px;
}
.type-with-sc {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 4px;
}
</style>
