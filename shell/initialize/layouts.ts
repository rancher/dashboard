import { sanitizeComponent } from '@shell/utils/nuxt';
import blank from '@shell/layouts/blank.vue';
import defaultLayout from '@shell/layouts/default.vue';
import home from '@shell/layouts/home.vue';
import plain from '@shell/layouts/plain.vue';
import unauthenticated from '@shell/layouts/unauthenticated.vue';
import standalone from '@shell/layouts/standalone.vue';

export type Component = { [key: string]: any };
export type Layouts = { [key: string]: Component };
const layouts: Layouts = { };

export function getLayouts(): Layouts {
  return layouts;
}

export function registerLayout(name: string, component: Component): void {
  layouts[`_${ name }`] = sanitizeComponent(component);
}

registerLayout('blank', blank) ;
registerLayout('default', defaultLayout) ;
registerLayout('home', home) ;
registerLayout('plain', plain) ;
registerLayout('unauthenticated', unauthenticated) ;
registerLayout('standalone', standalone);
