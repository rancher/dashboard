<script>
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
    value: {
      type:    Array,
      default: null,
    }
  },

  data() {
    let userValue = '';

    if ( this.value ) {
      userValue = this.value.join(' ');
    }

    return { userValue };
  },

  methods: {
    update(userValue) {
      let out = null;

      if ( userValue ) {
        out = userValue.split(/ /);
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

/*

export default TextField.extend({
  layout,
  type: 'text',

  disabled: false,

  init() {
    this._super(...arguments);

    let initial = get(this, 'initialValue') || '';

    if ( isArray(initial) ) {
      set(this, 'value', unparse(reop(initial)));
    } else {
      set(this, 'value', initial);
    }
  },

  valueChanged: observer('value', function() {
    let out = ShellQuote.parse(get(this, 'value') || '').map((piece) => {
      if ( typeof piece === 'object' && piece ) {
        if ( piece.pattern ) {
          return piece.pattern;
        } else if ( piece.op ) {
          return piece.op;
        } else {
          return '';
        }
      }

      return piece;
    });

    if ( out.length ) {
      if (this.changed) {
        this.changed(out);
      }
    } else {
      if (this.changed) {
        this.changed(null);
      }
    }
  }),
});
*/
