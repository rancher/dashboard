import { escapeHtml } from '../utils/string';
import { watchEffect, ref, h } from 'vue';
import { useStore } from '../composables/useStore';

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

function directive(el, binding, vnode /*, oldVnode */) {
  const { context } = vnode;
  const raw = binding.modifiers && binding.modifiers.raw === true;
  const str = stringFor(context.$store, binding.value, {}, raw);

  if ( binding.arg ) {
    el.setAttribute(binding.arg, str);
  } else {
    el.innerHTML = str;
  }
}

export function directiveSsr(vnode, binding) {
  // eslint-disable-next-line no-console
  console.warn('Function `directiveSsr` is deprecated. Please install i18n as a vue plugin: `Vue.use(i18n)`');

  const { context } = vnode;
  const raw = binding.modifiers && binding.modifiers.raw === true;
  const str = stringFor(context.$store, binding.value, {}, raw);

  if ( binding.arg ) {
    vnode.data.attrs[binding.arg] = str;
  } else {
    vnode.data.domProps = { innerHTML: str };
  }
}

export default {
  install: (Vue, _options) => {
    Vue.prototype.t = function(key, args, raw) {
      return stringFor(this.$store, key, args, raw);
    };

    // InnerHTML: <some-tag v-t="'some.key'" />
    // As an attribute: <some-tag v-t:title="'some.key'" />
    Vue.directive('t', {
      bind() {
        directive(...arguments);
      },
      update() {
        directive(...arguments);
      },
    });

    // Basic (but you might want the directive above): <t k="some.key" />
    // With interpolation: <t k="some.key" count="1" :foo="bar" />
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
