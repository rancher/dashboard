import { escapeHtml } from '../utils/string';
import { watchEffect, ref, h } from 'vue';
import { useStore } from '@/shell/composables/useStore';

function stringFor(store, key, args, raw = false, escapehtml = true) {
  const translation = store.getters['i18n/t'](key, args);

  let out;

  if ( translation !== undefined ) {
    out = translation;
  } else if ( args && Object.keys(args).length ) {
    const argStr = Object.keys(args).map((k) => `${ k }: ${ args[k] }`).join(', ');

    out = `%${ key }(${ argStr })%`;
    raw = true;
  } else {
    out = `%${ key }%`;
  }

  if ( raw ) {
    return out;
  } else if (escapehtml) {
    return escapeHtml(out);
  } else {
    return out;
  }
}

export default {
  install: (Vue, _options) => {
    Vue.prototype.t = function(key, args, raw) {
      return stringFor(this.$store, key, args, raw);
    };

    Vue.directive('t', {
      mounted(el, binding, vnode) {
        const { ctx } = vnode;
        const raw = binding.modifiers && binding.modifiers.raw === true;
        const str = stringFor(ctx.$store, binding.value, {}, raw);

        if (binding.arg) {
          el.setAttribute(binding.arg, str);
        } else {
          el.innerHTML = str;
        }
      },
      updated(el, binding, vnode) {
        const { ctx } = vnode;
        const raw = binding.modifiers && binding.modifiers.raw === true;
        const str = stringFor(ctx.$store, binding.value, {}, raw);

        if (binding.arg) {
          el.setAttribute(binding.arg, str);
        } else {
          el.innerHTML = str;
        }
      }
    });

    Vue.component('t', {
      inheritAttrs: false,
      props:        {
        k: {
          type:     String,
          required: true,
        },
        raw: {
          type:    Boolean,
          default: false,
        },
        tag: {
          type:    [String, Object],
          default: 'span'
        },
        escapehtml: {
          type:    Boolean,
          default: true,
        }
      },
      setup(props, ctx) {
        const msg = ref('');
        const store = useStore();

        // Update msg whenever k, $attrs, raw, or escapehtml changes
        watchEffect(() => {
          msg.value = stringFor(store, props.k, ctx.attrs, props.raw, props.escapehtml);
        });

        return { msg };
      },
      render() {
        if (this.raw) {
          return h(
            this.tag,
            { innerHTML: this.msg }
          );
        } else {
          return h(
            this.tag,
            [this.msg]
          );
        }
      }
    });
  }
};
