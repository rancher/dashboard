import { setKubeVersionData, setVersionData } from '@shell/config/version';

function checkVersionCompatibility(targetVersion: string, shellRancherVersion: string): void {
  const targetMatch = targetVersion?.match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/);
  const shellMatch = shellRancherVersion.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);

  if (targetMatch && shellMatch) {
    const targetMaj = parseInt(targetMatch[1], 10);
    const targetMin = parseInt(targetMatch[2], 10);
    const targetPatch = parseInt(targetMatch[3] ?? '0', 10);
    const shellMaj = parseInt(shellMatch[1], 10);
    const shellMin = parseInt(shellMatch[2], 10);
    const shellPatch = parseInt(shellMatch[3] ?? '0', 10);

    if (
      targetMaj < shellMaj ||
      (targetMaj === shellMaj && targetMin < shellMin) ||
      (targetMaj === shellMaj && targetMin === shellMin && targetPatch < shellPatch)
    ) {
      // eslint-disable-next-line no-console
      console.error(
        `Rancher version mismatch: target Rancher is ${ targetVersion } but this shell is compatible with v${ shellRancherVersion }.x.\n` +
        `Whilst this may mostly work, there may be areas that won't (where the shell depends on version-dependent Rancher features).\n` +
        `It's recommended to align your target Rancher and extension shell versions.\n` +
        `This only affects \`yarn dev\` — building and loading extensions continues to work.`
      );
    }
  }
}

class Versions {
    private promise?: Promise<any>;

    async fetch(context: { store: any }): Promise<any> {
      if (this.promise) {
        return this.promise;
      }

      const rancherVersionRequest = context.store.dispatch('rancher/request', {
        url:                  '/rancherversion',
        method:               'get',
        redirectUnauthorized: false
      }).then((response: any) => {
        setVersionData(response);

        // check if the target Rancher version is compatible with the shell's Rancher version (only in dev mode)
        if (process.env.NODE_ENV === 'dev' && process.env.UI_SHELL_RANCHER_VERSION) {
          checkVersionCompatibility(response?.Version, process.env.UI_SHELL_RANCHER_VERSION);
        }
      }).catch((e: Error) => {
        console.warn('Failed to fetch Rancher version metadata', e); // eslint-disable-line no-console
      });

      const kubeVersionRequest = context.store.dispatch('rancher/request', {
        url:                  '/version',
        method:               'get',
        redirectUnauthorized: false
      }).then((response: any) => {
        setKubeVersionData(response);
      }).catch((e: Error) => {
        console.warn('Failed to fetch Kube version metadata', e); // eslint-disable-line no-console
      });

      this.promise = Promise.allSettled([rancherVersionRequest, kubeVersionRequest]);

      return this.promise;
    }
}

const versions = new Versions();

export default versions;
