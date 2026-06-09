import { reactive } from 'vue';

interface VersionData {
  Version: string;
  RancherPrime: string;
  GitCommit: string;
  [key: string]: string;
}

interface KubeVersionData {
  gitVersion?: string;
  [key: string]: any;
}

const _versionData: VersionData = reactive({
  Version:      '',
  RancherPrime: 'false',
  GitCommit:    '',
});

const _kubeVersionData: KubeVersionData = reactive({});

export function isRancherPrime(): boolean {
  return _versionData.RancherPrime?.toLowerCase() === 'true';
}

export function getVersionData(): VersionData {
  return _versionData;
}

export function setVersionData(v: Record<string, any>): void {
  const clean = JSON.parse(JSON.stringify(v));

  for (const key of Object.keys(_versionData)) {
    if (!(key in clean)) {
      delete _versionData[key];
    }
  }
  Object.assign(_versionData, clean);
}

export function getKubeVersionData(): KubeVersionData {
  return _kubeVersionData;
}

export function setKubeVersionData(v: Record<string, any>): void {
  const clean = JSON.parse(JSON.stringify(v));

  for (const key of Object.keys(_kubeVersionData)) {
    if (!(key in clean)) {
      delete _kubeVersionData[key];
    }
  }
  Object.assign(_kubeVersionData, clean);
}

export const CURRENT_RANCHER_VERSION = '2.13';
