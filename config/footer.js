export function options(pl) {
  if ( pl !== 'rancher' ) {
    return {};
  }

  return {
    'footer.docs':   'https://rancher.com/docs/rancher/v2.x/en/',
    'footer.forums': 'https://forums.rancher.com/',
    'footer.slack':  'https://slack.rancher.io',
    'footer.issue':  'https://github.com/rancher/dashboard/issues/new',
  };
}
