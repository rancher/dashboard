import { DOCS_BASE } from '@/config/private-label';

export function options(issues, hideRancher, product) {
  if (!issues) {
    if (hideRancher) {
      return { };
    }
    issues = 'https://github.com/rancher/dashboard/issues/new';
  } else if (hideRancher) {
    return { 'footer.issue': issues };
  }

  if (product === 'harvester') {
    return {
      'footer.docs':   'https://github.com/harvester/harvester/tree/master/docs',
      'footer.forums': 'https://forums.rancher.com/',
      'footer.slack':  'https://slack.rancher.io',
      'footer.issue':  'https://github.com/harvester/harvester/issues/new/choose',
    };
  }

  return {
    'footer.docs':    DOCS_BASE,
    'footer.forums': 'https://forums.rancher.com/',
    'footer.slack':  'https://slack.rancher.io',
    'footer.issue':  issues,
  };
}
