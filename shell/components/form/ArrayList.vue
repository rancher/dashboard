<script>
import { ref, watch, computed } from 'vue';
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import { TextAreaAutoGrow } from '@rc/Form/TextArea';
import { clone } from '@shell/utils/object';
import { LabeledInput } from '@rc/Form/LabeledInput';
const DEFAULT_PROTIP = 'Tip: Paste lines into any list field for easy bulk entry';

export default {
  emits: ['add', 'remove', 'update:value'],

  components: { TextAreaAutoGrow, LabeledInput },
  props:      {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },
    title: {
      type:    String,
      default: ''
    },
    protip: {
      type:    [String, Boolean],
      default: DEFAULT_PROTIP,
    },
    showHeader: {
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
    valueMultiline: {
      type:    Boolean,
      default: false,
    },
    addClass: {
      type:    String,
      default: '',
    },
    addIcon: {
      type:    String,
      default: '',
    },
    addLabel: {
      type:    String,
      default: '',
    },
    addAllowed: {
      type:    Boolean,
      default: true,
    },
    addDisabled: {
      type:    Boolean,
      default: false,
    },
    removeLabel: {
      type:    String,
      default: '',
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
    },
    required: {
      type:    Boolean,
      default: false
    },
    rules: {
      default:   () => [],
      type:      Array,
      // we only want functions in the rules array
      validator: (rules) => rules.every((rule) => ['function'].includes(typeof rule))
    },
    a11yLabel: {
      type:    String,
      default: '',
    },
    componentTestid: {
      type:    String,
      default: 'array-list',
    }
  },

  setup(props, { emit }) {
    const input = (Array.isArray(props.value) ? props.value : []).slice();
    const rows = ref([]);

    for ( const value of input ) {
      rows.value.push({ value });
    }
    if ( !rows.value.length && props.initialEmptyRow ) {
      const value = props.defaultAddValue ? clone(props.defaultAddValue) : '';

      rows.value.push({ value });
    }

    const isView = computed(() => {
      return props.mode === _VIEW;
    });

    /**
     * Cleanup rows and emit input
     */
    const update = () => {
      if ( isView.value ) {
        return;
      }
      const out = [];

      for ( const row of rows.value ) {
        const trim = !props.valueMultiline && (typeof row.value === 'string');
        const value = trim ? row.value.trim() : row.value;

        if ( typeof value !== 'undefined' ) {
          out.push(value);
        }
      }
      emit('update:value', out);
    };

    const lastUpdateWasFromValue = ref(false);
    const queueUpdate = debounce(update, 50);

    watch(
      rows,
      () => {
        // lastUpdateWasFromValue is used to break a cycle where when rows are updated
        // this was called which then forced rows to updated again
        if (!lastUpdateWasFromValue.value) {
          queueUpdate();
        }
        lastUpdateWasFromValue.value = false;
      },
      { deep: true }
    );

    watch(
      () => props.value,
      () => {
        lastUpdateWasFromValue.value = true;
        rows.value = (props.value || []).map((v) => ({ value: v }));
      },
      { deep: true }
    );

    return {
      rows,
      lastUpdateWasFromValue,
      queueUpdate,
      isView,
      update,
    };
  },

  computed: {
    _addLabel() {
      return this.addLabel || this.t('generic.ariaLabel.genericAddRow');
    },
    _removeLabel() {
      return this.removeLabel || this.t('generic.remove');
    },
    showAdd() {
      return this.addAllowed;
    },
    disableAdd() {
      return this.addDisabled;
    },
    showRemove() {
      return this.removeAllowed;
    },
    isDefaultProtip() {
      return this.protip === DEFAULT_PROTIP;
    },
    showProtip() {
      if (this.protip && !this.isDefaultProtip) {
        return true;
      }

      return !this.valueMultiline && this.protip;
    }
  },
  created() {
  },
  methods: {
    add() {
      this.rows.push({ value: clone(this.defaultAddValue) });
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
    /**
     * Remove item and emits removed row and its own index value
     */
    remove(row, index) {
      this.$emit('remove', { row, index });
      removeAt(this.rows, index);
      this.queueUpdate();
    },

    /**
     * Handle paste event, e.g. split multiple lines in rows
     */
    onPaste(index, event) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');

      if (this.valueMultiline) {
        // Allow to paste multiple lines
        this.rows[index].value = text;
      } else {
        // Prevent to paste the value and emit text in multiple rows
        const split = text.split('\n').map((value) => ({ value }));

        event.preventDefault();
        this.rows.splice(index, 1, ...split);
      }

      this.update();
    }
  },
};
</script>

<template>
  <div
    class="array-list-main-container"
    role="group"
    :aria-label="title || t('generic.ariaLabel.arrayList')"
  >
    <div
      v-if="title"
      class="clearfix"
      role="group"
    >
      <slot name="title">
        <h3>
          {{ title }}
          <span
            v-if="required"
            class="required"
            aria-hidden="true"
          >*</span>
          <i
            v-if="showProtip"
            v-clean-tooltip="{content: protip, triggers: ['hover', 'touch', 'focus'] }"
            class="icon icon-info"
            tabindex="0"
          />
        </h3>
      </slot>
    </div>

    <div>
      <template v-if="rows.length">
        <div
          v-if="showHeader"
          class="array-list-header-group"
          role="group"
        >
          <slot name="column-headers">
            <label class="value text-label mb-10">
              {{ valueLabel }}
            </label>
          </slot>
        </div>
        <div
          v-for="(row, idx) in rows"
          :key="idx"
          :data-testid="`${componentTestid}-box${ idx }`"
          class="box"
          :class="{'hide-remove-is-view': isView}"
          role="group"
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
                <TextAreaAutoGrow
                  v-if="valueMultiline"
                  ref="value"
                  v-model:value="row.value"
                  :data-testid="`${componentTestid}-textarea-${idx}`"
                  :placeholder="valuePlaceholder"
                  :mode="mode"
                  :disabled="disabled"
                  :aria-label="a11yLabel ? `${a11yLabel} ${t('generic.ariaLabel.genericRow', {index: idx+1})}` : undefined"
                  @paste="onPaste(idx, $event)"
                  @update:value="queueUpdate"
                />
                <LabeledInput
                  v-else-if="rules.length > 0"
                  ref="value"
                  v-model:value="row.value"
                  :data-testid="`${componentTestid}-labeled-input-${idx}`"
                  :placeholder="valuePlaceholder"
                  :disabled="isView || disabled"
                  :rules="rules"
                  :compact="false"
                  :aria-label="a11yLabel ? `${a11yLabel} ${t('generic.ariaLabel.genericRow', {index: idx+1})}` : undefined"
                  @paste="onPaste(idx, $event)"
                  @update:value="queueUpdate"
                />
                <input
                  v-else
                  ref="value"
                  v-model="row.value"
                  :data-testid="`${componentTestid}-input-${idx}`"
                  :placeholder="valuePlaceholder"
                  :disabled="isView || disabled"
                  :aria-label="a11yLabel ? `${a11yLabel} ${t('generic.ariaLabel.genericRow', {index: idx+1})}` : undefined"
                  @paste="onPaste(idx, $event)"
                >
              </slot>
            </div>
          </slot>
          <div
            v-if="showRemove && !isView"
            class="remove"
          >
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
                :data-testid="`${componentTestid}-remove-item-${idx}`"
                :aria-label="t('generic.ariaLabel.remove', {index: idx+1})"
                role="button"
                @click="remove(row, idx)"
              >
                {{ _removeLabel }}
              </button>
            </slot>
          </div>
          <slot
            name="value-sub-row"
            :row="row"
            :mode="mode"
            :isView="isView"
          />
        </div>
      </template>
      <div v-else>
        <slot name="empty">
          <div
            v-if="mode==='view'"
            class="text-muted"
          >
            &mdash;
          </div>
        </slot>
      </div>
      <div
        v-if="showAdd && !isView"
        class="footer mmt-6"
      >
        <slot
          v-if="showAdd"
          name="add"
          :add="add"
        >
          <button
            type="button"
            class="btn role-tertiary add"
            :class="[addClass]"
            :disabled="loading || disableAdd"
            :data-testid="`${componentTestid}-button`"
            :aria-label="_addLabel"
            role="button"
            @click="add()"
          >
            <i
              class="mr-5 icon"
              :class="loading ? ['icon-lg', 'icon-spinner','icon-spin']: [addIcon]"
            />
            {{ _addLabel }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .title {
    margin-bottom: 10px;
  }

  .required {
    color: var(--error);
  }

  .box {
    display: grid;
    grid-template-columns: auto $array-list-remove-margin;
    align-items: center;
    margin-bottom: 10px;
    .value {
      flex: 1;
      INPUT {
        height: $unlabeled-input-height;
      }
    }
  }

  .box.hide-remove-is-view {
    grid-template-columns: auto;
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

  .required {
    color: var(--error);
  }
</style>
