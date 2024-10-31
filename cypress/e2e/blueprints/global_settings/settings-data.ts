// settings data
export const settings = {
  'password-min-length': {
    original: '12',
    new:      '13'
  },
  'system-default-registry': {
    original: '<None>',
    new:      'docker.io'
  },
  'auth-token-max-ttl-minutes': {
    original: '0',
    new:      '10'
  },
  'auth-user-session-ttl-minutes': {
    original: '960',
    new:      '900'
  },
  'auth-user-info-max-age-seconds': {
    original: '3600',
    new:      '3500'
  },
  'engine-iso-url': {
    original: 'https://releases.rancher.com/os/latest/rancheros-vmware.iso',
    new:      'https://releases.rancher.com/os/latest/rancheros-vmware.isoABC'
  },
  'ingress-ip-domain': {
    original: 'sslip.io',
    new:      'sslip.ioABC'
  },
  'kubeconfig-generate-token': {
    original: 'true',
    new:      'false'
  },
  'kubeconfig-default-token-ttl-minutes': {
    original: '43200',
    new:      '100'
  },
  'auth-user-info-resync-cron': {
    original: '0 0 * * *',
    new:      '0 9 * * *'
  },
  'ui-index':             { new: 'https://e2e-test.html' },
  'ui-dashboard-index':   { new: 'https://e2e-test.html' },
  'ui-offline-preferred': {
    original: 'Dynamic',
    new:      'Local',
    new2:     'Remote'
  },
  'ui-brand': {
    original: '<None>',
    new:      'suse'
  },
  'cluster-template-enforcement': {
    original: 'false',
    new:      'true'
  },
  'hide-local-cluster': {
    original: 'false',
    new:      'true'
  },
  'k3s-based-upgrader-uninstall-concurrency': {
    original: '5',
    new:      '10'
  }
};
export const serverUrlLocalhostCases = [
  'http://LOCALhosT:8005',
  'http://localhost:8005',
  'https://localhost:8005',
  'localhost',
  'http://127.0.0.1',
  'https://127.0.0.1',
  '127.0.0.1'
];
export const urlWithTrailingForwardSlash = 'https://test.com/';
export const httpUrl = 'http://test.com';
export const nonUrlCases = [
  'test',
  'https',
  'test.com',
  'a.test.com'
];
