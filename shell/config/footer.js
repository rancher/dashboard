import { DOCS_BASE } from '@shell/config/private-label';

// Deprecated
export function options(isSupport, issuesUrl, hideRancher) {
  if (!issuesUrl) {
    if (hideRancher) {
      return { };
    }
    issuesUrl = 'https://github.com/rancher/dashboard/issues/new';
  } else if (hideRancher) {
    return { 'File an issue': issuesUrl };
  }

  const links = {
    docs:        DOCS_BASE,
    forums:     'https://forums.rancher.com/',
    slack:      'https://slack.rancher.io',
    issues:     issuesUrl,
    getStarted: '/docs/getting-started'
  };

  if (!isSupport) {
    links['commercialSupport'] = '/support';
  }

  return links;
}
