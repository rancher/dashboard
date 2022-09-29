import { DOCS_BASE } from '@shell/config/private-label';

// Deprecated
export function options(isSupport, issuesUrl) {
  const links = {
    docs:        DOCS_BASE,
    forums:     'https://forums.rancher.com/',
    slack:      'https://slack.rancher.io',
    issues:     !!issuesUrl ? issuesUrl : 'https://github.com/rancher/dashboard/issues/new',
    getStarted: '/docs/getting-started'
  };

  if (!isSupport) {
    links['commercialSupport'] = '/support';
  }

  return links;
}
