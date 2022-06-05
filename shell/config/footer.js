import { DOCS_BASE } from '@shell/config/private-label';

export function options(issues, hideRancher) {
  if (!issues) {
    if (hideRancher) {
      return { };
    }
    issues = 'https://github.com/rancher/dashboard/issues/new';
  } else if (hideRancher) {
    return { 'footer.issue': issues };
  }

  return {
    'footer.docs':    DOCS_BASE,
    'footer.forums': 'https://forums.rancher.com/',
    'footer.slack':  'https://slack.rancher.io',
    'footer.issue':  issues,
  };
}
