<script>
import LabeledInput from '@shell/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
    value: {
      type:    Array,
      default: null,
    }
  },
  /*
      userValue is a string representation of args array, with spaces between each array item and single quotes around any items with whitespace
      value input of ["-c", "sleep 600"]
      is displayed as: "-c 'sleep 600'"

      user input of "-c "sleep 600"" or "-c 'sleep 600'"
      causes $emit 'input' of ["-c", "sleep 600"]
  */
  data() {
    let userValue = '';

    if ( this.value ) {
      userValue = this.value.reduce((str, each) => {
        if (each.includes(' ')) {
          str += `'${ each }'`;
        } else {
          str += each;
        }
        str += ' ';

        return str;
      }, '').trim();
    }

    return { userValue };
  },

  methods: {
    update(userValue) {
      let out = null;

      if ( userValue ) {
        out = userValue.match(/('[^']+')|("[^"]+")|\S+/g).map(string => string.replace(/^'|'$|^"|"$/g, ''));
      }
      this.$emit('input', out);
    },
  }
};

export const OPS = ['||', '&&', ';;', '|&', '&', ';', '(', ')', '|', '<', '>'];
export function reop(xs) {
  return xs.map((s) => {
    if ( OPS.includes(s) ) {
      return { op: s };
    } else {
      return s;
    }
  });
}

export function unparse(xs) {
  return xs.map((s) => {
    if ( s && typeof s === 'object' ) {
      if ( Object.prototype.hasOwnProperty.call(s, 'pattern') ) {
        return `"${ s.pattern }"`;
      } else {
        return s.op;
      }
    } else if ( /["\s]/.test(s) && !/'/.test(s) ) {
      return `'${ s.replace(/(['\\])/g, '\\$1') }'`;
    } else if ( /["'\s]/.test(s) ) {
      return `"${ s.replace(/(["\\$`!])/g, '\\$1') }"`;
    } else {
      return String(s).replace(/([\\$`()!#&*|])/g, '\\$1');
    }
  }).join(' ');
}

</script>

<template>
  <LabeledInput
    v-model="userValue"
    v-bind="$attrs"
    @input="update($event)"
  />
</template>
