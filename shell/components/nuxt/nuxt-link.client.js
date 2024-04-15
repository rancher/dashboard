// TODO: #9541 Remove for Vue 3 migration
/**
 * Prints a deprecation warning for any extensions that might be using NuxtLink
 * @param {string} aliasName The alias that will print the deprecation warning
 * @returns Functional component that prints a deprecation warning and renders a
 * `router-link` instead
 */
export const nuxtLinkAlias = (aliasName) => {
  return {
    functional: true,
    render(createElement, context) {
      console.warn(`${aliasName} is deprecated in Rancher Dashboard. Use 'router-link' instead.`);
      return createElement('router-link', context.data, context.children);
    }
  }
}
