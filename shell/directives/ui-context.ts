import { get } from '@shell/utils/object';

interface Context {
  tag: string;
  path?: string;
  value?: any;
  description?: string;
  icon?: string;
}

function isValid(context: Context ): context is Context {
  return (
    context !== null &&
    typeof context === 'object' &&
    (
      (context.path === undefined && context.value === undefined) || // both undefined is allowed
      (typeof context.path === 'string' && context.path?.length > 0 && context.value === undefined) || // path defined, value undefined
      (context.value !== undefined && context.path === undefined) // value defined, path undefined
    ) &&
    typeof context.tag === 'string' && context.tag?.length > 0 &&
    (typeof context.description === 'string' || context.description === undefined)
  );
}

/** UI Context Directive
 *
 * Usage:
 *   <div v-ui-context="{ tag: 'example-tag', path: 'some.path.in.component', description: 'An example context' }"></div>
 *   or
 *   <div v-ui-context="{ tag: 'example-tag', value: 'Direct Value', description: 'An example context with direct value' }"></div>
 *   or
 *   <div v-ui-context="{ tag: 'example-tag', description: 'An example context with text content' }">Text Content Value</div>
 *
 * The directive will register the context on mount and unregister it before unmounting.
 *
 * The context object must have a 'tag' and either a 'path' or a 'value'.
 * If both 'path' and 'value' are undefined, the element's textContent will be used as the value.
 *
 * !IMPORTANT:
 *   The value object will be reactive only when using 'path'.
 *   Using 'value' or textContent will not be reactive.
 *
*/
export default {
  async mounted(el: any, binding: { value: Context, instance: any }) {
    const context = binding.value;

    if (!isValid(context)) {
      throw new Error(`Invalid ui-context value: ${ JSON.stringify({ tag: (context as Context).tag, description: (context as Context).description }) }`);
    }

    if (context.path === undefined && context.value === undefined) {
      // path and value undefined, use textContent as value
      context.value = el.textContent;
    } else if (context.value === undefined) {
      // Use context.value directly if provided, otherwise resolve it from the component instance using context.path
      const value = get(binding.instance, context.path);

      if (value === undefined) {
        throw new Error(`[ui-context] path "${ context.path }" is undefined on the component instance`);
      }

      context.value = value;
    }

    delete context.path;

    el._uiContextId = await binding.instance.$store.dispatch('ui-context/add', context);
  },

  async beforeUnmount(el: any, binding: { instance: any }) {
    const store = binding.instance.$store;

    await store.dispatch('ui-context/remove', el._uiContextId);
  }
};
