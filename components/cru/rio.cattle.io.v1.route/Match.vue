<script>
export default {
  props:      {
    match: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      matchOpts:        ['Path', 'Scheme', 'Method', 'Headers', 'Cookies', 'Port'],
      matchStringTypes: ['exact', 'prefix', 'regex'],
      nextType:         'Path'
    };
  },
  methods: {
    availableOpts(match) {
      const vm = this;

      return this.matchOpts.filter(opt => !match[opt] && vm.selectedOpt !== opt);
    },
    addMatchString(opt) {
      this.$set(this.match, opt, { value: '', method: 'exact' });
      this.nextType = '';
    }
  }
};
</script>

<template>
  <div>
    <div v-for="(string,type) in match" :key="type" class="match-strings">
      <v-select :searchable="false" :clearable="false" :value="type" :options="availableOpts(match)" @input="selectMatchOpt"></v-select>
      <input v-model="match[type]['value']" type="text" />
      <template v-for="stringType in matchStringTypes">
        <input
          :key="stringType"
          v-model="match[type]['stringMatchType']"
          type="radio"
          :value="stringType"
        >
        <label :key="stringType">{{ stringType }}</label>
      </template>
      <div v-if="availableOpts(match).length">
        AND
      </div>
    </div>
    <div v-if="availableOpts(match).length">
      <v-select :searchable="false" :clearable="false" :value="nextType" :options="availableOpts(match)" @input="addMatchString"></v-select>
      <!-- <input v-model="match[type]" type="text" /> -->
    </div>
    <hr />
  </div>
</template>

<style scoped lang='scss'>
  @import "@/assets/styles/base/_variables.scss";
  @import "@/assets/styles/base/_functions.scss";
  @import "@/assets/styles/base/_mixins.scss";
.match-strings {
  & label {
    color: var(--input-label);
    padding-right: 1%;
  }
}
</style>
