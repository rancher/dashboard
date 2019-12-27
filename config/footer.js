export function options(pl) {
  if ( pl !== 'rancher' ) {
    return {};
  }

  return {
    'footer.docs':   'https://github.com/rancher/rio',
    'footer.forums': 'https://forums.rancher.com/c/rio',
    'footer.slack':  'https://slack.rancher.io',
    'footer.issue':  'https://github.com/rancher/dashboard/issues/new',
  };
}
