<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import debounce from 'lodash/debounce';
import { removeAt } from '@shell/utils/array';

export default {
  name:       'LabeledArrayList',
  components: { LabeledInput },
  mixins:     [VerrazzanoHelper],
  props:      {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: 'create',
    },
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },
    valueLabel: {
      type:    String,
      default: 'Value',
    },
    valuePlaceholder: {
      type:    String,
      default: 'e.g. bar'
    },
    valueType: {
      type:    String,
      default: undefined
    },
    valueMin: {
      type:    String,
      default: undefined
    },
    valueMax: {
      type:    String,
      default: undefined
    },
    addLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.add');
      },
    },
    addAllowed: {
      type:    Boolean,
      default: true,
    },
    removeLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.remove');
      },
    },
    removeAllowed: {
      type:    Boolean,
      default: true,
    },
    defaultAddValue: {
      type:    [String, Number, Object, Array],
      default: ''
    },
    loading: {
      type:    Boolean,
      default: false
    },
    disabled: {
      type:    Boolean,
      default: false,
    }
  },
  data() {
    const input = (this.value || []).slice();
    const rows = [];

    for ( const value of input ) {
      rows.push({ value });
    }

    if ( !rows.length && this.initialEmptyRow ) {
      const value = this.defaultAddValue ? this.clone(this.defaultAddValue) : '';

      rows.push({ value });
    }

    return { rows, lastUpdateWasFromValue: false };
  },
  computed: {
    showAdd() {
      return this.addAllowed;
    },
    showRemove() {
      return this.removeAllowed;
    },
  },
  methods: {
    add() {
      this.rows.push({ value: this.clone(this.defaultAddValue) });
      if (this.defaultAddValue) {
        this.queueUpdate();
      }

      this.$nextTick(() => {
        const inputs = this.$refs.value;

        if ( inputs && inputs.length > 0 ) {
          inputs[inputs.length - 1].focus();
        }

        this.$emit('add');
      });
    },
    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },
    update() {
      if ( this.isView ) {
        return;
      }

      const out = [];

      for ( const row of this.rows ) {
        const trim = typeof row.value === 'string';
        const value = trim ? row.value.trim() : row.value;

        if ( typeof value !== 'undefined' ) {
          out.push(value);
        }
      }

      this.$emit('input', out);
    },
    onPaste(index, event) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      const split = text.split('\n').map(value => ({ value }));

      this.rows.splice(index, 1, ...split);
      this.update();
    }
  },
  watch: {
    value() {
      this.lastUpdateWasFromValue = true;
      this.rows = (this.value || []).map(v => ({ value: v }));
    },
    rows: {
      deep: true,
      handler(newValue, oldValue) {
        // lastUpdateWasFromValue is used to break a cycle where when rows are updated
        // this was called which then forced rows to updated again
        if (!this.lastUpdateWasFromValue) {
          this.queueUpdate();
        }
        this.lastUpdateWasFromValue = false;
      }
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 50);
  },
};
</script>

<template>
  <div>
    <template v-if="rows.length">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="box"
      >
        <slot
          name="columns"
          :queueUpdate="queueUpdate"
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
              :queue-update="queueUpdate"
            >
              <LabeledInput
                ref="value"
                v-model="row.value"
                :label="valueLabel"
                :type="valueType"
                :min="valueMin"
                :placeholder="valuePlaceholder"
                :disabled="isView || disabled"
                @paste.prevent="onPaste(idx, $event)"
                @input="queueUpdate"
              />
            </slot>
          </div>
        </slot>
        <div v-if="showRemove" class="remove">
          <slot name="remove-button" :remove="() => remove(idx)" :i="idx" :row="row">
            <button
              type="button"
              :disabled="isView"
              class="btn role-link"
              :data-testid="`remove-item-${idx}`"
              @click="remove(idx)"
            >
              {{ removeLabel }}
            </button>
          </slot>
        </div>
      </div>
    </template>
    <div v-else-if="mode==='view'" class="text-muted">
      &mdash;
    </div>
    <div v-else>
      <slot name="empty" />
    </div>
    <div v-if="showAdd && !isView" class="footer">
      <slot v-if="showAdd" name="add">
        <button
          type="button"
          class="btn role-tertiary add"
          :disabled="loading"
          data-testid="add-item"
          @click="add()"
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
