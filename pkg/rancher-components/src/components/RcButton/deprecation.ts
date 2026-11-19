const reported = new Set<string>();

/**
 * Reports a message once per key. Lives outside the component because
 * `<script setup>` runs its body per instance, so state declared there would
 * reset for every button.
 */
export const warnOnce = (message: string, key = message) => {
  if (reported.has(key)) {
    return;
  }

  reported.add(key);
  console.warn(message); // eslint-disable-line no-console
};

/**
 * Shared key for the deprecated props and variant values, so the console gets
 * one line for all of them rather than one per deprecated name. The call sites
 * are tracked in https://github.com/rancher/dashboard/issues/19913.
 */
export const DEPRECATED_API = 'rc-button-deprecated-api';
