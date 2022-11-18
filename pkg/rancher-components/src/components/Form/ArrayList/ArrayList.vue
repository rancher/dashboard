<script lang='ts'>
import Vue, { PropType } from 'vue';
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import { clone } from '@shell/utils/object';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ArrayListData, ArrayListRow } from './types';

const DEFAULT_PROTIP =
  'Tip: Paste lines into any list field for easy bulk entry';

export default Vue.extend({
  components: { TextAreaAutoGrow, LabeledInput },

  props: {
    value: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
    mode: {
      type: String,
      default: _EDIT,
    },
    initialEmptyRow: {
      type: Boolean,
      default: false,
    },

    title: {
      type: String,
      default: '',
    },
    protip: {
      type: [String, Boolean],
      default: DEFAULT_PROTIP,
    },
    showHeader: {
      type: Boolean,
      default: false,
    },

    valueLabel: {
      type: String,
      default: 'Value',
    },
    valuePlaceholder: {
      type: String,
      default: 'e.g. bar',
    },
    valueMultiline: {
      type: Boolean,
      default: false,
    },

    addLabel: {
      type: String,
      required: true,
    },
    addAllowed: {
      type: Boolean,
      default: true,
    },

    removeLabel: {
      type: String,
      required: true,
    },
    removeAllowed: {
      type: Boolean,
      default: true,
    },

    defaultAddValue: {
      type: [String, Number, Object, Array],
      default: '',
    },

    loading: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    rules: {
      default: () => [],
      type: Array,
      // we only want functions in the rules array
      validator: (rules) =>
        rules.every((rule) => ['function'].includes(typeof rule)),
    },
  },

  data(): ArrayListData {
    const input: string[] = (this.value || []).slice();
    const rows: ArrayListRow[] = [];

    for (const value of input) {
      rows.push({ value });
    }

    if (!rows.length && this.initialEmptyRow) {
      const value = this.defaultAddValue ? clone(this.defaultAddValue) : '';

      rows.push({ value });
    }

    return { rows, lastUpdateWasFromValue: false };
  },

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },

    showAdd(): boolean {
      return this.addAllowed;
    },

    showRemove(): boolean {
      return this.removeAllowed;
    },

    isDefaultProtip(): boolean {
      return this.protip === DEFAULT_PROTIP;
    },

    showProtip(): boolean {
      if (this.protip && !this.isDefaultProtip) {
        return true;
      }

      return !this.valueMultiline && !!this.protip;
    },
  },

  methods: {
    add() {
      this.rows.push({ value: clone(this.defaultAddValue) });

      this.$nextTick(() => {
        const inputs: any = this.$refs.value;

        if (inputs && inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }

        this.$emit('add');
      });
    },

    /**
     * Remove item and emits removed row and its own index value
     */
    remove(row: ArrayListRow, index: number): void {
      this.$emit('remove', { row, index });
      removeAt(this.rows, index);
    },

    trim(text: string){
        const trim = !this.valueMultiline && typeof text === 'string';
        return trim ? text.trim() : text;
    },

    update(idx: number, text: string) {
      if (this.isView) {
        return;
      }

      const out = [];

      this.rows = this.rows.map((item, i) => {
        if (idx === i) {
          return { value: this.trim(item.value) };
        }
        return item;
      })

      this.$emit('input', this.rows);
    },

    onPaste(index: number, event: any) {
      if (this.valueMultiline) {
        return;
      }

      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      const split = text.split('\n').map((value: string) => ({ value }));

      this.rows.splice(index, 1, ...split);
      this.$emit('input', this.rows)
    },
  },
});
</script>
<template>
  <div>
    <div v-if="title" class="clearfix">
      <slot name="title">
        <h3>
          {{ title }}
          <i v-if="showProtip" v-tooltip="protip" class="icon icon-info" />
        </h3>
      </slot>
    </div>

    <template v-if="rows.length">
      <div v-if="showHeader">
        <slot name="column-headers">
          <label class="value text-label mb-10">
            {{ valueLabel }}
          </label>
        </slot>
      </div>
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="box"
        data-testid="array-list-box"
      >
        <slot
          name="columns"
          :i="idx"
          :rows="rows"
          :row="row"
          :mode="mode"
          :isView="isView"
        >
          <div class="value">
            <slot
              name="value"
              :row="row"
              :mode="mode"
              :isView="isView"
            >
              <TextAreaAutoGrow
                v-if="valueMultiline"
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                :mode="mode"
                :disabled="disabled"
                @paste="onPaste(idx, $event)"
                @input="update(idx, $event)"
              />
              <LabeledInput
                v-else-if="rules.length > 0"
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                :disabled="isView || disabled"
                :rules="rules"
                :compact="false"
                @paste="onPaste(idx, $event)"
                @input="update(idx, $event)"
              />
              <input
                v-else
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                :disabled="isView || disabled"
                @paste="onPaste(idx, $event)"
                @input="update(idx, $event)"
              />
            </slot>
          </div>
        </slot>
        <div v-if="showRemove" class="remove">
          <slot
            name="remove-button"
            :remove="() => remove(row, idx)"
            :i="idx"
            :row="row"
          >
            <button
              type="button"
              :disabled="isView"
              class="btn role-link"
              :data-testid="`remove-item-${idx}`"
              @click="remove(row, idx)"
            >
              {{ removeLabel }}
            </button>
          </slot>
        </div>
      </div>
    </template>
    <div v-else-if="mode === 'view'" class="text-muted">&mdash;</div>
    <div v-else>
      <slot name="empty" />
    </div>
    <div v-if="showAdd && !isView" class="footer">
      <slot v-if="showAdd" name="add" :add="add">
        <button
          data-testid="array-list-button"
          type="button"
          class="btn role-tertiary add"
          :disabled="loading"
          @click="add"
        >
          <i v-if="loading" class="mr-5 icon icon-spinner icon-spin icon-lg" />
          {{ addLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  margin-bottom: 10px;
}

.box {
  display: grid;
  grid-template-columns: auto $array-list-remove-margin;
  align-items: center;

  margin-bottom: 10px;
  .value {
    flex: 1;
    INPUT {
      height: $input-height;
    }
  }
}

.remove {
  text-align: right;
}

.footer {
  .protip {
    float: right;
    padding: 5px 0;
  }
}
</style>
