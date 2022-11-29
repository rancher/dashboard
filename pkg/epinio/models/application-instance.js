import Resource from '@shell/plugins/dashboard-store/resource-class';
import { EPINIO_PRODUCT_NAME } from '../types';

export default class ApplicationInstanceResource extends Resource {
  get _availableActions() {
    return [{
      action:  'showAppShell',
      label:   this.t('epinio.applications.actions.onlyShell.label'),
      icon:    'icon icon-fw icon-chevron-right',
      enabled: this.ready,
    }];
  }

  get state() {
    switch (this.ready) {
    case true:
      return 'ready';
    case false:
      return 'notready';
    default:
      return 'pending';
    }
  }

  showAppShell() {
    this.$dispatch('wm/open', {
      id:        `epinio-${ this.application.id }-app-shell`,
      label:     `${ this.application.meta.name } - App Shell`,
      product:   EPINIO_PRODUCT_NAME,
      icon:      'chevron-right',
      component: 'ApplicationShell',
      attrs:     {
        application:     this.application,
        endpoint:        this.application.linkFor('shell'),
        initialInstance: this.name,
      }
    }, { root: true });
  }
}
