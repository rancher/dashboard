export function isRancherPrime(): boolean;
export function getVersionData(): {
    Version: string;
    RancherPrime: string;
    GitCommit: string;
    [key: string]: string;
};
export function setVersionData(v: Record<string, any>): void;
export function getKubeVersionData(): {
    gitVersion?: string;
    [key: string]: any;
};
export function setKubeVersionData(v: Record<string, any>): void;
export const CURRENT_RANCHER_VERSION: string;
