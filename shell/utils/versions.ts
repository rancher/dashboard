import { setKubeVersionData, setVersionData } from '@shell/config/version';

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
