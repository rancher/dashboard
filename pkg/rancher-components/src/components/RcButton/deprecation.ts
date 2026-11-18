const reported = new Set<string>();

/**
 * Reports a deprecation once per message. Lives outside the component because
 * `<script setup>` runs its body per instance, so state declared there would
 * reset for every button.
 */
export const warnOnce = (message: string) => {
  if (reported.has(message)) {
    return;
  }

  reported.add(message);
  console.warn(message); // eslint-disable-line no-console
};
