import EpinioMetaResource from '~/pkg/epinio/models/epinio-namespaced-resource';

export default class GithubCommits extends EpinioMetaResource {
  get availableActions() {
    return [{
      action:     'github-commits',
      label:      this.t('epinio.applications.actions.shell.label'),
      icon:       'icon icon-fw icon-chevron-right',
      enabled:    true,
    }];
  }
}
