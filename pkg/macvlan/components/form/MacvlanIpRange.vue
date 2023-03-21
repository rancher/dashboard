<script>
import { mapGetters } from 'vuex';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import Banner from '@components/Banner/Banner.vue';

export default {
  mixins:     [LabeledFormElement],
  components: { LabeledInput, Banner },

  props: {
    value: {
      type:    Array,
      default: null,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },
    ipRangesExistedMsg: {
      type:    String,
      default: '',
    },
  },

  data() {
    let oldLength = 0;

    if (this.mode === 'edit' && this.value.length) {
      oldLength = this.value.length;
    }

    return { rows: this.value, oldLength };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    isView() {
      return this.mode === _VIEW;
    },

    showAdd() {
      return !this.isView;
    },

    showRemove() {
      return !this.isView;
    },
    validationMessage() {
      // we want to grab the required rule passed in if we can but if it's not there then we can just grab it from the formRulesGenerator
      const requiredRule = this.rules.find(rule => rule?.name === 'required');
      const ruleMessages = [];
      const value = this?.value;

      if (requiredRule && this.blurred && !this.focused) {
        const message = requiredRule(value);

        if (!!message) {
          return message;
        }
      }

      for (const rule of this.rules) {
        const message = rule(value);

        if (!!message && rule.name !== 'required') { // we're catching 'required' above so we can ignore it here
          ruleMessages.push(message);
        }
      }
      if (ruleMessages.length > 0) {
        return ruleMessages.join(', ');
      } else {
        return undefined;
      }
    }
  },

  methods: {
    add() {
      this.rows.push({
        rangeEnd:   '',
        rangeStart: ''
      });

      this.$nextTick(() => {
        const inputs = this.$refs.ipStart;

        inputs[inputs.length - 1].focus();
      });
    },

    remove(idx) {
      removeAt(this.rows, idx);
    },
  },
};
</script>

<template>
  <div
    class="mb-20 macvlan-ip-range"
    :style="{'width':'100%'}"
  >
    <h3 style="position: relative; display: inline-block;">
      {{ t('macvlan.ipRange.label') }}
      <i
        v-if="!!validationMessage"
        v-tooltip="validationMessage"
        class="hover icon status-icon icon-warning"
      />
    </h3>
    <Banner
      v-if="ipRangesExistedMsg"
      color="warning"
      :label="t('macvlan.ipRange.IPRangeExist') + ': ' + ipRangesExistedMsg"
    />
    <div class="ip-range-headers">
      <label class="text-label">
        {{ t('macvlan.ipRange.start.label') }}
        <span class="required">*</span>
      </label>
      <div />
      <label class="text-label">
        {{ t('macvlan.ipRange.end.label') }}
        <span class="required">*</span>
      </label>
    </div>
    <div
      v-for="(row, idx) in rows"
      :key="idx"
      class="ip-range-row"
    >
      <div class="ip-start">
        <LabeledInput
          ref="ipStart"
          v-model="row.rangeStart"
          :mode="mode"
          :placeholder="t('macvlan.ipRange.start.placeholder')"
          :disabled="idx < oldLength"
        />
      </div>

      <div>-</div>

      <div class="ip-end">
        <LabeledInput
          v-model="row.rangeEnd"
          :mode="mode"
          :placeholder="t('macvlan.ipRange.end.placeholder')"
          :disabled="idx < oldLength"
        />
      </div>
      <div
        v-if="showRemove"
        class="remove"
      >
        <button
          type="button"
          class="btn role-link"
          :disabled="idx < oldLength"
          @click="remove(idx)"
        >
          {{ t('macvlan.ipRange.remove') }}
        </button>
      </div>
    </div>
    <div
      v-if="showAdd"
      class="footer"
    >
      <button
        type="button"
        class="btn role-tertiary add"
        @click="add()"
      >
        {{ t('macvlan.ipRange.add') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.macvlan-ip-range{
  .status-icon,.required {
      color: var(--error);
  }
}
.ip-range-headers, .ip-range-row{
  display: grid;
  grid-template-columns: 30% 3px 30%  90px .5fr .5fr;
  grid-column-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;
}

.ip-range-headers {
  color: var(--input-label);
}

.remove BUTTON {
  padding: 0px;
}

.ip-range-row INPUT {
  height: 50px;
}
</style>
