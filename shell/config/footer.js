import { DOCS_BASE } from '@shell/config/private-label';

// Deprecated
export function options(isSupport, issues, hideRancher) {
  if (!issues) {
    if (hideRancher) {
      return { };
    }
    issues = 'https://github.com/rancher/dashboard/issues/new';
  } else if (hideRancher) {
    return { 'File an issue': issues };
  }

  const links = {
    Docs:              DOCS_BASE,
    Forums:            'https://forums.rancher.com/',
    Slack:             'https://slack.rancher.io',
    'File an Issue':   issues,
    'Getting started': '/docs/getting-started'
  };

  if (!isSupport) {
    links['Commercial Support'] = '/support';
  }

  return links;
}
