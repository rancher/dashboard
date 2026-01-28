<script lang="ts">
import { isEmpty } from 'lodash';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { CONFIG_MAP, SECRET } from '@shell/config/types';
import { PropType } from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { RcButton } from '@components/RcButton';
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
  id: number,
  valueFrom: ValueFrom
}

interface DataType {
  allSecrets: object[] | null,
  allConfigMaps: object[] | null,
  valuesFrom: ValuesFrom[],
  id: number,
}

export default {

  name: 'FleetValuesFrom',

  emits: ['update:value'],

  components: {
    RcButton,
    ValueFromResource
  },

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
      id:            0,
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
      this.valuesFrom.push({
        id:        this.id++,
        valueFrom: {}
      });

      this.update();

      (this.$refs['add-button'] as { $el: HTMLElement })?.$el?.blur();
    },

    updateValueFrom(id: number, value: ValuesFrom) {
      for (let index = 0; index < this.valuesFrom.length; index++) {
        if (this.valuesFrom[index].id === id) {
          const oldKeyRefName = Object.keys(this.valuesFrom[index]?.valueFrom || {})[0] as KeyRefName;
          const newKeyRefName = Object.keys(value?.valueFrom || {})[0] as KeyRefName;

          const oldKey = this.valuesFrom[index]?.valueFrom?.[oldKeyRefName]?.name;
          const newKey = value?.valueFrom?.[newKeyRefName]?.name;

          if (oldKeyRefName && newKeyRefName && oldKeyRefName !== newKeyRefName) {
            this.valuesFrom[index].valueFrom = { [newKeyRefName]: {} };
          } else if (oldKey && newKey && oldKey !== newKey) {
            this.valuesFrom[index].valueFrom = {
              [newKeyRefName]: {
                ...(value?.valueFrom?.[newKeyRefName] || {}),
                key: ''
              },
            };
          } else {
            this.valuesFrom[index].valueFrom = value?.valueFrom;
          }

          break;
        }
      }

      this.update();
    },

    removeValueFrom(id: number) {
      this.valuesFrom = this.valuesFrom.filter((el) => el.id !== id);

      this.update();
    },

    update() {
      const value = this.toValuesFrom(this.valuesFrom, this.namespace);

      this.$emit('update:value', value);
    },

    fromValuesFrom(data: ValueFrom[]): ValuesFrom[] {
      return (data || [])
        .map((elem) => {
          const out = { id: this.id++ } as ValuesFrom;

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
  <div
    v-if="!allConfigMaps || !allSecrets"
    data-testid="fleet-values-from-loading"
  >
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
    data-testid="fleet-values-from-list"
  >
    <h2
      v-t="'fleet.helmOp.values.valuesFrom.selectLabel'"
      class="m-0"
    />
    <div
      v-for="row in valuesFrom"
      :key="row.id + '-' + row?.valueFrom?.configMapKeyRef?.key + '-' + row?.valueFrom?.secretKeyRef?.key"
      class="mmt-4"
    >
      <ValueFromResource
        :data-testid="`fleet-values-from-item-${ row.id }`"
        :value="row"
        :options="valueFromOptions"
        :all-secrets="allSecrets"
        :all-config-maps="allConfigMaps"
        :namespaced="true"
        :mode="mode"
        :show-variable-name="true"
        @remove="removeValueFrom(row.id)"
        @update:value="updateValueFrom(row.id, $event)"
      />
    </div>
    <RcButton
      v-if="!isView"
      ref="add-button"
      size="small"
      variant="secondary"
      class="mmt-6"
      data-testid="fleet-values-from-add"
      @click="addValueFrom"
    >
      <i class="icon icon-add" />
      {{ t('workload.container.command.addEnvVar') }}
    </RcButton>
  </div>
</template>

<style lang="scss" scoped>
  .var-row {
    margin-bottom: 0;
  }
</style>
