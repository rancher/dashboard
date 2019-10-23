<script>
/*
    headerOperations
        - add []
            -name
            -value
        - set []
            -name
            -value
        - remove [] string
*/
import NameValue from '@/components/cru/rio.cattle.io.v1.router/NameValue';
import RadioGroup from '@/components/form/RadioGroup';
export default {
  components: { NameValue, RadioGroup },
  props:      {
    spec: {
      type:    Object,
      default: () => {}
    }
  },
  data() {
    const { add = [], set = [], remove = [] } = this.spec;

    return {
      add, set, remove
    };
  },
  methods: {
    change() {
      const { add, set, remove } = this;

      this.$emit('input', {
        add, set, remove
      });
    },
    addRule(rule) {
      this.add.unshift({ name: '', value: '' });
    },
    changeRule(index, method, rule) {
      this[method][index] = rule;
    },
    changeRuleType(index, type, origin) {
      const rule = this[origin].splice(index, 1)[0];

      this[type].push(rule);
    }
  }
};
</script>

<template>
  <div @input="change">
    <button class="btn bg-primary btn-sm" @click="addRule">
      add header rule
    </button>
    <div v-for="(rule, i) in add" :key="rule.name + rule.value + add.length" class="rule-set add">
      <NameValue :spec="{...rule}" @input="e=>changeRule(i, 'add', e)" />
      <RadioGroup :options="['add', 'set', 'remove']" :selected="0" @input="e=>changeRuleType(i, e, 'add')" />
    </div>
    <div v-for="(rule, i) in set" :key="rule.name + rule.value + set.length" class="rule-set set">
      <NameValue :spec="{...rule}" @input="e=>changeRule(i, 'set', e)" />
      <RadioGroup :options="['add', 'set', 'remove']" :selected="1" @input="e=>changeRuleType(i, e, 'set')" />
    </div>
    <div v-for="(rule, i) in remove" :key="rule.name + rule.value + remove.length" class="rule-set remove">
      <NameValue :spec="{...rule}" @input="e=>changeRule(i, 'remove', e)" />
      <RadioGroup :options="['add', 'set', 'remove']" :selected="2" @input="e=>changeRuleType(i, e, 'remove')" />
    </div>
  </div>
</template>

<style lang='scss'>
    .rule-set, .rule-set > * {
        display: flex;
        flex-direction: row;
    }
</style>
