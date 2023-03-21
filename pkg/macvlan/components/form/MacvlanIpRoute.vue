<script>
import { mapGetters } from 'vuex';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledFormElement from '@shell/mixins/labeled-form-element';

export default {
  mixins:     [LabeledFormElement],
  components: { LabeledInput, LabeledSelect },

  props: {
    value: {
      type:    Array,
      default: null,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },
  },

  data() {
    return { rows: this.value };
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

    ifaceChoices() {
      return [
        {
          label: 'eth1',
          value: 'eth1',
        },
        {
          label: 'eth0',
          value: 'eth0',
        },
      ];
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
        dst:   '',
        gw:    '',
        iface: 'eth1'
      });

      this.$nextTick(() => {
        const inputs = this.$refs.dst;

        inputs && inputs.length && inputs[inputs.length - 1].focus();
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
    class="mb-20 macvlan-route"
    :style="{'width':'100%'}"
  >
    <h3 style="position: relative; display: inline-block;">
      {{ t('macvlan.route.label') }}
      <i
        v-if="!!validationMessage"
        v-tooltip="validationMessage"
        class="hover icon status-icon icon-warning"
      />
    </h3>
    <div class="route-headers">
      <label class="text-label">
        {{ t('macvlan.route.dst.label') }}
        <span class="required">*</span>
      </label>
      <label class="text-label">
        {{ t('macvlan.route.gw.label') }}
      </label>
      <label class="text-label">
        {{ t('macvlan.route.iface.label') }}
      </label>
    </div>
    <div
      v-for="(row, idx) in rows"
      :key="idx"
      class="route-row"
    >
      <div class="dst">
        <LabeledInput
          ref="dst"
          v-model="row.dst"
          :mode="mode"
          :placeholder="t('macvlan.route.dst.placeholder')"
        />
      </div>
      <div class="gw">
        <LabeledInput
          v-model="row.gw"
          :mode="mode"
          :placeholder="t('macvlan.route.gw.placeholder')"
        />
      </div>
      <div class="iface">
        <LabeledSelect
          v-model="row.iface"
          :disabled="isView"
          :options="ifaceChoices"
          :mode="mode"
          :placeholder="t('macvlan.route.iface.placeholder')"
        />
      </div>
      <div
        v-if="showRemove"
        class="remove"
      >
        <button
          type="button"
          class="btn role-link"
          @click="remove(idx)"
        >
          {{ t('macvlan.route.remove') }}
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
        {{ t('macvlan.route.add') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.macvlan-route{
  .status-icon,.required {
      color: var(--error);
  }
}
.route-headers, .route-row{
  display: grid;
  grid-template-columns: 25% 25% 25%  90px .5fr .5fr;
  grid-column-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;
}

.route-headers {
  color: var(--input-label);
}

.remove BUTTON {
  padding: 0px;
}

.route-row INPUT {
  height: 50px;
}
</style>
