// settings data
export const settings = {
  'password-min-length':                { new: '13' },
  'system-default-registry':            { new: 'docker.io' },
  'auth-token-max-ttl-minutes':         { new: '10' },
  'auth-user-session-idle-ttl-minutes': {
    original: '960',
    new:      '200'
  },
  'auth-user-session-ttl-minutes':        { new: '900' },
  'auth-user-info-max-age-seconds':       { new: '3500' },
  'engine-iso-url':                       { new: 'https://releases.rancher.com/os/latest/rancheros-vmware.isoABC' },
  'ingress-ip-domain':                    { new: 'sslip.ioABC' },
  'kubeconfig-generate-token':            { new: 'false' },
  'kubeconfig-default-token-ttl-minutes': { new: '100' },
  'auth-user-info-resync-cron':           { new: '0 9 * * *' },
  'ui-index':                             { new: 'https://e2e-test.html' },
  'ui-dashboard-index':                   { new: 'https://e2e-test.html' },
  'ui-offline-preferred':                 {
    new:  'Local',
    new2: 'Remote',
    new3: 'Dynamic',
  },
  'ui-brand':                                  { new: 'suse' },
  'cluster-template-enforcement':              { new: 'true' },
  'hide-local-cluster':                        { new: 'true' },
  'k3s-based-upgrader-uninstall-concurrency':  { new: '10' },
  'system-agent-upgrader-install-concurrency': { new: '6' }
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
