import type { Component } from 'vue';

/**
 * Configuration object for opening a slide-in panel.
 *
 * @property component - The Vue component to render in the slide-in panel.
 *                       This should be a valid Vue Component, such as an imported SFC or functional component.
 *
 * @property componentProps - (Optional) An object containing props to be passed to the component rendered in the slide-in panel.
 *                            Keys should match the props defined in the provided component.
 */
export interface SlideInConfig {
  component: Component | null;
  componentProps?: Record<string, any>;
}
