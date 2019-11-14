<script>
import { typeOf } from '../../utils/sort';
import { get } from '@/utils/object';

export default {
  props: {
    value: {
      type:     Array,
      default: () => {
        return [];
      }
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },
  computed: {
    route() {
      return this.value[0];
    },
    matches() {
      return get(this.route, 'match');
    },
    methodToShow() {
      if (this.matches.path) {
        return 'path';
      } else {
        return Object.keys(this.matches)[0];
      }
    },
    valueToShow() {
      switch (this.methodToShow) {
      case 'path':
        return Object.values(this.matches.path)[0];
      case 'headers':
        return { name: this.matches.headers[0].name, value: Object.values(this.matches.headers[0].value)[0] };
      case 'cookies':
        return { name: this.matches.cookies[0].name, value: Object.values(this.matches.cookies[0].value)[0] };
      case 'methods':
        return this.matches.methods.join(', ');
      default:
        return null;
      }
    },
    remaining() {
      let numConditions = 0;

      for (const type in this.matches) {
        if (typeOf(this.matches[type]) === 'array' && type !== 'methods') {
          numConditions += this.matches[type].length;
        } else {
          numConditions++;
        }
      }

      return numConditions - 1;
    }
  }
};
</script>

<template>
  <span v-if="methodToShow">
    <span v-if="methodToShow==='headers'||methodToShow==='cookies'">
      {{ methodToShow }} = {{ valueToShow.name }}:{{ valueToShow.value }}
    </span>
    <span v-else>
      {{ methodToShow }} = {{ valueToShow }}
    </span>
    <br />
    <span v-if="remaining>0" class="plus-more">+{{ remaining }} more</span>
  </span>
  <span v-else class="text-muted">
    &mdash;
  </span>
</template>

<style lang='scss'>
.col-router-match {
  color: var(--input-label);
}
.plus-more{
  color: var(  --input-placeholder );
  font-size: 0.8em;
}
</style>
