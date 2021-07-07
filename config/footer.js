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
    'footer.docs':   'https://rancher.com/docs/rancher/v2.x/en/',
    'footer.forums': 'https://forums.rancher.com/',
    'footer.slack':  'https://slack.rancher.io',
    'footer.issue':  issues,
  };
}
