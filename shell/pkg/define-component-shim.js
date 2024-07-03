// Shim that ensures that defineComponent is available

import { defineComponent as vueDefineComponent } from 'vue';

export function defineComponent(opts) {
  // Use the function from Vue, if available
  if (vueDefineComponent) {
    return vueDefineComponent(opts);
  }

  // Otherwise, just return the opts
  return opts;
}
