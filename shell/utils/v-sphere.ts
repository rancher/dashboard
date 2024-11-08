import merge from 'lodash/merge';
import { SECRET } from '@shell/config/types';
import { PROVISIONING_PRE_BOOTSTRAP } from '@shell/store/features';

export const VMWARE_VSPHERE = 'vmwarevsphere';

type Rke2Component = {
    versionInfo: any;
    userChartValues: any;
    chartVersionKey: (chartName: string) => string;
    value: any;
    isEdit: boolean;
    provider: string;
    $store: any,
}

type SecretDetails = {
  generateName: string,
  upstreamClusterName: string,
  upstreamNamespace: string,
  downstreamName: string,
  downstreamNamespace: string,
  json?: object,
}
type Values = any;

type ChartValues = {
    defaultValues: Values,
    userValues: Values,
    combined: Values,
};

const rootGenerateName = 'vsphere-secret-';

type SecretJson = any;

class VSphereUtils {
  private async findSecret(
    { $store }: Rke2Component, {
      generateName, upstreamClusterName, upstreamNamespace, downstreamName, downstreamNamespace
    }: SecretDetails): Promise<SecretJson | undefined> {
    // Fetch secrets in a specific namespace and partially matching the name to the generate name
    const secrets = await $store.dispatch('management/request', { url: `/v1/${ SECRET }/${ upstreamNamespace }?filter=metadata.name=${ generateName }` });

    // Filter by specific annotations
    const applicableSecret = secrets.data?.filter((s: any) => {
      return s.metadata.annotations['provisioning.cattle.io/sync-target-namespace'] === downstreamNamespace &&
        s.metadata.annotations['provisioning.cattle.io/sync-target-name'] === downstreamName &&
        s.metadata.annotations['rke.cattle.io/object-authorized-for-clusters'].includes(upstreamClusterName);
    });

    // If there's more than one the user should tidy up... as it'll cause mayhem with the actual sync from local --> downstream cluster
    if (applicableSecret.length > 1) {
      return Promise.reject(new Error(`Found multiple matching secrets (${ upstreamNamespace }/${ upstreamNamespace } for ${ upstreamClusterName }), this will cause synchronizing mishaps. Consider removing stale secrets from old clusters`));
    }

    return applicableSecret[0];
  }

  private async findOrCreateSecret(
    rke2Component: Rke2Component,
    {
      generateName, upstreamClusterName, upstreamNamespace, downstreamName, downstreamNamespace, json
    }: SecretDetails
  ) {
    const { $store } = rke2Component;

    const secretJson = await this.findSecret(rke2Component, {
      generateName,
      upstreamClusterName,
      upstreamNamespace,
      downstreamName,
      downstreamNamespace
    }) || json;

    return await $store.dispatch('management/create', secretJson);
  }

  private findChartValues({
    versionInfo,
    userChartValues,
    chartVersionKey,
  }: Rke2Component, chartName: string): ChartValues | undefined {
    const chartValues = versionInfo[chartName]?.values;

    if (!chartValues) {
      return;
    }
    const userValues = userChartValues[chartVersionKey(chartName)];

    return {
      defaultValues: chartValues,
      userValues,
      combined:      merge({}, chartValues || {}, userValues || {})
    };
  }

  /**
   * Check that system is setup to handle vsphere secrets syncing downstream
   *
   * Do this via checking the provider and that the required FF is enabled.
   */
  private handleVsphereSecret({ $store, provider }: { $store: any, provider: string}): boolean {
    if (provider !== VMWARE_VSPHERE) {
      return false;
    }

    const isPrebootstrapEnabled = $store.getters['features/get'](PROVISIONING_PRE_BOOTSTRAP);

    if (!isPrebootstrapEnabled) {
      return false;
    }

    return true;
  }

  /**
    * Create upstream vsphere cpi secret to sync downstream
    */
  async handleVsphereCpiSecret(rke2Component: Rke2Component) {
    if (!this.handleVsphereSecret(rke2Component)) {
      return;
    }

    const generateName = `${ rootGenerateName }cpi-`;
    const downstreamName = 'rancher-vsphere-cpi-credentials';
    const downstreamNamespace = 'kube-system';
    const { value } = rke2Component;

    // check values for cpi chart has 'use our method' checkbox
    const { userValues, combined } = this.findChartValues(rke2Component, 'rancher-vsphere-cpi') || {};

    if (!combined?.vCenter?.credentialsSecret?.generate) {
      if (userValues?.vCenter?.username) {
        userValues.vCenter.username = '';
      }
      if (userValues?.vCenter?.password) {
        userValues.vCenter.password = '';
      }

      return;
    }

    // find values needed in cpi chart value - https://github.com/rancher/vsphere-charts/blob/main/charts/rancher-vsphere-cpi/questions.yaml#L16-L42
    const { username, password, host } = combined.vCenter;

    if (!username || !password || !host) {
      throw new Error('vSphere CPI username, password and host are all required when generating a new secret');
    }

    // create secret as per https://github.com/rancher/vsphere-charts/blob/main/charts/rancher-vsphere-cpi/templates/secret.yaml
    const upstreamClusterName = value.metadata.name;
    const upstreamNamespace = value.metadata.namespace;
    const secret = await this.findOrCreateSecret(rke2Component, {
      generateName,
      upstreamClusterName,
      upstreamNamespace,
      downstreamName,
      downstreamNamespace,
      json: {
        type:     SECRET,
        metadata: {
          namespace: upstreamNamespace,
          generateName,
          labels:    {
            'vsphere-cpi-infra': 'secret',
            component:           'rancher-vsphere-cpi-cloud-controller-manager'
          },
          annotations: {
            'provisioning.cattle.io/sync-target-namespace': downstreamNamespace,
            'provisioning.cattle.io/sync-target-name':      downstreamName,
            'rke.cattle.io/object-authorized-for-clusters': upstreamClusterName,
            'provisioning.cattle.io/sync-bootstrap':        'true'
          }
        },
      }
    });

    secret.setData(`${ host }.username`, username);
    secret.setData(`${ host }.password`, password);

    await secret.save();

    // reset cpi chart values
    if (!userValues.vCenter.credentialsSecret) {
      userValues.vCenter.credentialsSecret = {};
    }
    userValues.vCenter.credentialsSecret.generate = false;
    userValues.vCenter.credentialsSecret.name = downstreamName;
    userValues.vCenter.username = '';
    userValues.vCenter.password = '';
  }

  /**
    * Create upstream vsphere csi secret to sync downstream
    */
  async handleVsphereCsiSecret(rke2Component: Rke2Component) {
    if (!this.handleVsphereSecret(rke2Component)) {
      return;
    }

    const generateName = `${ rootGenerateName }csi-`;
    const downstreamName = 'rancher-vsphere-csi-credentials';
    const downstreamNamespace = 'kube-system';
    const { value } = rke2Component;

    // check values for cpi chart has 'use our method' checkbox
    const { userValues, combined } = this.findChartValues(rke2Component, 'rancher-vsphere-csi') || {};

    if (!combined?.vCenter?.configSecret?.generate) {
      if (userValues?.vCenter?.username) {
        userValues.vCenter.username = '';
      }
      if (userValues?.vCenter?.password) {
        userValues.vCenter.password = '';
      }

      return;
    }

    // find values needed in cpi chart value - https://github.com/rancher/vsphere-charts/blob/main/charts/rancher-vsphere-csi/questions.yaml#L1-L36
    const {
      username, password, host, datacenters, port, insecureFlag
    } = combined.vCenter;

    if (!username || !password || !host || !datacenters) {
      throw new Error('vSphere CSI username, password, host and datacenters are all required when generating a new secret');
    }

    // This is a copy of https://github.com/rancher/vsphere-charts/blob/a5c99d716df960dc50cf417d9ecffad6b55ca0ad/charts/rancher-vsphere-csi/values.yaml#L12-L21
    // Which makes it's way into the secret via https://github.com/rancher/vsphere-charts/blob/main/charts/rancher-vsphere-csi/templates/secret.yaml#L8
    let configTemplateString = '      [Global]\n      cluster-id = {{ required \".Values.vCenter.clusterId must be provided\" (default .Values.vCenter.clusterId .Values.global.cattle.clusterId) | quote }}\n      user = {{ .Values.vCenter.username | quote }}\n      password = {{ .Values.vCenter.password | quote }}\n      port = {{ .Values.vCenter.port | quote }}\n      insecure-flag = {{ .Values.vCenter.insecureFlag | quote }}\n\n      [VirtualCenter {{ .Values.vCenter.host | quote }}]\n      datacenters = {{ .Values.vCenter.datacenters | quote }}';

    configTemplateString = configTemplateString.replace('{{ required \".Values.vCenter.clusterId must be provided\" (default .Values.vCenter.clusterId .Values.global.cattle.clusterId) | quote }}', `"{{clusterId}}"`);
    configTemplateString = configTemplateString.replace('{{ .Values.vCenter.username | quote }}', `"${ username }"`);
    configTemplateString = configTemplateString.replace('{{ .Values.vCenter.password | quote }}', `"${ password }"`);
    configTemplateString = configTemplateString.replace('{{ .Values.vCenter.port | quote }}', `"${ port }"`);
    configTemplateString = configTemplateString.replace('{{ .Values.vCenter.insecureFlag | quote }}', `"${ insecureFlag }"`);
    configTemplateString = configTemplateString.replace('{{ .Values.vCenter.host | quote }}', `"${ host }"`);
    configTemplateString = configTemplateString.replace('{{ .Values.vCenter.datacenters | quote }}', `"${ datacenters }"`);
    // create secret as per https://github.com/rancher/vsphere-charts/blob/main/charts/rancher-vsphere-csi/templates/secret.yaml
    const upstreamClusterName = value.metadata.name;
    const upstreamNamespace = value.metadata.namespace;

    const secret = await this.findOrCreateSecret(rke2Component, {
      generateName,
      upstreamClusterName,
      upstreamNamespace,
      downstreamName,
      downstreamNamespace,
      json: {
        type:     SECRET,
        metadata: {
          namespace:   upstreamNamespace,
          generateName,
          annotations: {
            'provisioning.cattle.io/sync-target-namespace': downstreamNamespace,
            'provisioning.cattle.io/sync-target-name':      downstreamName,
            'rke.cattle.io/object-authorized-for-clusters': upstreamClusterName,
            'provisioning.cattle.io/sync-bootstrap':        'true'
          }
        },
      }
    });

    secret.setData(`csi-vsphere.conf`, configTemplateString);

    await secret.save();

    // reset csi chart values
    if (!userValues.vCenter.configSecret) {
      userValues.vCenter.configSecret = {};
    }
    userValues.vCenter.configSecret.generate = false;
    userValues.vCenter.configSecret.name = downstreamName;
    userValues.vCenter.username = '';
    userValues.vCenter.password = '';
    userValues.vCenter.host = '';
    userValues.vCenter.datacenters = '';
  }
}

const utils = new VSphereUtils();

export default utils;
