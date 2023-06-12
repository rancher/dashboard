// We use this file when building libraries - we don't want the dynamic code from the shell
// to be imported again, so we substitute this file which does not have any requires

export function importCloudCredential(name) {
  return () => undefined;
}

export function importMachineConfig(name) {
  return () => undefined;
}

export function importLogin(name) {
  return () => undefined;
}

export function importChart(name) {
  return () => undefined;
}

export function importList(name) {
  return () => undefined;
}

export function importDetail(name) {
  return () => undefined;
}

export function importEdit(name) {
  return () => undefined;
}

export function importDialog(name) {
  return () => undefined;
}

export function listProducts() {
  return [];
}

export function loadProduct(name, $plugin) {
  return () => undefined;
}

export function loadTranslation(name) {
  return () => undefined;
}

export function importCustomPromptRemove(name) {
  return () => undefined;
}

export function resolveList(key) {
  return undefined;
}

export function resolveChart(key) {
  return undefined;
}

export function resolveEdit(key) {
  return undefined;
}

export function resolveDetail(key) {
  return undefined;
}

export function importWindowComponent(name) {
  return () => undefined;
}

export function resolveWindowComponent(key) {
  return undefined;
}

export function resolveMachineConfigComponent(key) {
  return undefined;
}

export function resolveCloudCredentialComponent(key) {
  return undefined;
}
