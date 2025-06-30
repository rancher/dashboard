<script lang="ts">
import { isEmpty } from 'lodash';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { CONFIG_MAP, SECRET } from '@shell/config/types';
import { PropType } from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import ValueFromResource from '@shell/components/form/ValueFromResource.vue';

type KeyRefName = 'configMapKeyRef' | 'secretKeyRef';

interface KeyRef {
  key: string,
  name: string,
  namespace?: string,
}

interface ValueFrom {
  configMapKeyRef?: KeyRef,
  secretKeyRef?: KeyRef,
}

interface ValuesFrom {
  name?: string,
  valueFrom: ValueFrom
}

interface DataType {
  allSecrets: object[] | null,
  allConfigMaps: object[] | null,
  valuesFrom: ValuesFrom[],
}

export default {

  name: 'FleetValuesFrom',

  emits: ['update:value'],

  components: { ValueFromResource },

  props: {
    value: {
      type:    Array as PropType<ValueFrom[]>,
      default: () => []
    },

    namespace: {
      type:    String,
      default: ''
    },

    mode: {
      type:    String,
      default: _EDIT
    },
  },

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      allSecrets: {
        inStoreType: 'management',
        type:        SECRET
      },

      allConfigMaps: {
        inStoreType: 'management',
        type:        CONFIG_MAP
      }
    }, this.$store) as { allSecrets: object[], allConfigMaps: object[] };

    this.allSecrets = hash.allSecrets || [];
    this.allConfigMaps = hash.allConfigMaps || [];
  },

  data(): DataType {
    return {
      allSecrets:    null,
      allConfigMaps: null,
      valuesFrom:    [],
    };
  },

  mounted() {
    this.valuesFrom = this.fromValuesFrom(this.value);
  },

  watch: {
    namespace() {
      this.valuesFrom = [];

      this.update();
    },
  },

  computed: {
    valueFromOptions() {
      return [
        {
          value: 'configMapKeyRef', label: this.t('fleet.helmOp.values.valuesFrom.options.configMapKeyRef'), hideVariableName: true
        },
        {
          value: 'secretKeyRef', label: this.t('fleet.helmOp.values.valuesFrom.options.secretKeyRef'), hideVariableName: true
        },
      ];
    },

    isView(): boolean {
      return this.mode === _VIEW;
    }
  },

  methods: {
    addValueFrom() {
      this.valuesFrom.push({ valueFrom: {} });

      this.update();
    },

    updateValueFrom(index: number, value: ValuesFrom) {
      const oldValueFrom = Object.keys(this.valuesFrom[index]?.valueFrom || {})[0] as KeyRefName;
      const newValueFrom = Object.keys(value?.valueFrom || {})[0] as KeyRefName;

      const oldKeyRef = this.valuesFrom[index]?.valueFrom?.[oldValueFrom]?.name;
      const newKeyRef = value?.valueFrom?.[newValueFrom]?.name;

      if (oldValueFrom && newValueFrom && oldValueFrom !== newValueFrom) {
        this.valuesFrom[index] = {
          name:      value.name,
          valueFrom: { [newValueFrom]: {} }
        };
      } else if (oldKeyRef && newKeyRef && oldKeyRef !== newKeyRef) {
        this.valuesFrom[index] = {
          name:      value.name,
          valueFrom: {
            [newValueFrom]: {
              ...(value?.valueFrom?.[newValueFrom] || {}),
              key: ''
            },
          }
        };
      } else {
        this.valuesFrom[index] = value;
      }

      this.update();
    },

    removeValueFrom(index: number) {
      this.valuesFrom.splice(index, 1);

      this.update();
    },

    update() {
      const value = this.toValuesFrom(this.valuesFrom, this.namespace);

      this.$emit('update:value', value);
    },

    fromValuesFrom(data: ValueFrom[]): { valueFrom: ValueFrom }[] {
      return (data || [])
        .map((elem) => {
          const out = {} as ValuesFrom;

          const cm = elem?.configMapKeyRef;

          if (cm) {
            out.valueFrom = {
              configMapKeyRef: {
                key:  cm.key || '',
                name: cm.name || '',
              }
            };
          }

          const sc = elem?.secretKeyRef;

          if (sc) {
            out.valueFrom = {
              secretKeyRef: {
                key:  sc.key || '',
                name: sc.name || '',
              }
            };
          }

          return out;
        })
        .filter((el) => !isEmpty(el || {}));
    },

    toValuesFrom(data: { valueFrom: ValueFrom }[], namespace: string): ValueFrom[] | undefined {
      const res = (data || [])
        .map((elem) => {
          const cm = elem?.valueFrom?.configMapKeyRef;
          const sc = elem?.valueFrom?.secretKeyRef;

          const out = {} as ValueFrom;

          if (cm?.name) {
            out.configMapKeyRef = {
              key:  cm.key,
              name: cm.name,
              namespace
            };
          }

          if (sc?.name) {
            out.secretKeyRef = {
              key:  sc.key,
              name: sc.name,
              namespace
            };
          }

          return out;
        })
        .filter((el) => !isEmpty(el || {}));

      return res.length ? res : undefined;
    }
  }
};
</script>

<template>
  <div v-if="!allConfigMaps || !allSecrets">
    <i
      class="icon icon-lg icon-spinner icon-spin"
    />
    <label class="text-label ml-10">
      {{ t('fleet.helmOp.values.valuesFrom.loading') }}
    </label>
  </div>
  <div
    v-else
    class="values-from-container"
  >
    <h2 v-t="'fleet.helmOp.values.valuesFrom.selectLabel'" />
    <div
      v-for="(row, i) in valuesFrom"
      :key="row?.name + '-' + row?.valueFrom?.configMapKeyRef?.key + '-' + row?.valueFrom?.secretKeyRef?.key"
    >
      <ValueFromResource
        :value="row"
        :options="valueFromOptions"
        :all-secrets="allSecrets"
        :all-config-maps="allConfigMaps"
        :namespaced="true"
        :mode="mode"
        :show-variable-name="true"
        @remove="removeValueFrom(i)"
        @update:value="updateValueFrom(i, $event)"
      />
    </div>
    <button
      v-if="!isView"
      v-t="'workload.container.command.addEnvVar'"
      type="button"
      class="btn role-tertiary add"
      data-testid="add-env-var"
      @click="addValueFrom"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
