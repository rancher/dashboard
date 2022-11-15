<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
  },
  props: {
    mode: {
      type:    String,
      default: 'create'
    },
    value: {
      type: Object,
      default() {
        return {};
      }
    },
    refData: {
      type:    Object,
      require: true,
      default() {
        return {};
      }
    }
  },
  data() {
    let type;

    if (this.value._type) {
      type = this.value._type;
    } else if (!!this.value.secret) {
      type = 'secret';
    } else {
      type = 'configMap';
    }
    const items = cloneDeep(this.value[type]?.items ?? []);
    const specific = items.length > 0;

    return {
      specific,
      items
    };
  },
  computed: {
    keys() {
      return Object.keys(this.refData?.data ?? {});
    },
    type() {
      if (this.value._type) {
        return this.value._type;
      }
      if (!!this.value.secret) {
        return 'secret';
      }

      return 'configMap';
    }
  },
  watch: {
    items: {
      handler(value) {
        const emptyValues = ['', null, undefined];
        const props = ['key', 'path', 'mode'];
        const type = this.type;

        const items = value.reduce((t, c) => {
          const item = {};

          props.forEach((p) => {
            const v = c[p];

            if (!emptyValues.includes(v)) {
              item[p] = v;
            }
          });

          if (!isEmpty(item)) {
            t.push(item);
          }

          return t;
        }, []);

        if (isEmpty(items)) {
          delete this.value[type].items;
        } else {
          this.value[type].items = items;
        }
      },
      deep: true
    },
    specific(v) {
      this.items = [];
      if (v) {
        this.add();
      }
    },
    'value.configMap.name'() {
      this.items = [];
      this.specific = false;
    },
    'value.secret.secretName'() {
      this.items = [];
      this.specific = false;
    },
  },
  methods: {
    add() {
      if (this.keys.length === 0) {
        return;
      }
      this.items.push({
        key:  '',
        path: '',
        mode: null,
      });
    },
    remove(i) {
      this.items.splice(i, 1);
    }
  }
};
</script>
<template>
  <div>
    <div class="mb-10">
      <RadioGroup
        v-model="specific"
        :mode="mode"
        name="specific"
        :row="true"
        :label="t('workload.storage.keyToPath.header')"
        :options="[false, true]"
        :labels="[t('workload.storage.keyToPath.default'), t('workload.storage.keyToPath.specific')]"
      />
    </div>
    <template v-if="specific">
      <div class="key-to-path mb-10">
        <div>{{ t('workload.storage.keyToPath.key.label') }}<span class="text-error">*</span></div>
        <div>{{ t('workload.storage.keyToPath.path.label') }}<span class="text-error">*</span></div>
        <div>{{ t('workload.storage.keyToPath.mode.label') }}</div>
        <div />
      </div>
      <div
        v-for="(item, index) in items"
        :key="index"
        class="key-to-path mb-10"
      >
        <LabeledSelect
          v-model="item.key"
          :options="keys"
          :mode="mode"
        />
        <LabeledInput
          v-model.trim="item.path"
          :mode="mode"
          :placeholder="t('workload.storage.keyToPath.path.placeholder')"
        />
        <LabeledInput
          v-model.number="item.mode"
          type="number"
          :mode="mode"
          :placeholder="t('workload.storage.keyToPath.mode.placeholder')"
        />
        <button
          v-if="mode!=='view'"
          type="button"
          class="btn btn-sm role-link action"
          @click="remove(index)"
        >
          {{ t('generic.remove') }}
        </button>
        <div v-else />
      </div>
      <button
        v-if="mode!=='view'"
        type="button"
        class="btn role-tertiary mt-10"
        :disabled="keys.length === 0"
        @click="add"
      >
        {{ t('workload.storage.keyToPath.addAction') }}
      </button>
    </template>
  </div>
</template>
<style scoped>
.key-to-path {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 80px;
  column-gap: 10px;
}
.action {
  align-self: center;
}
</style>
