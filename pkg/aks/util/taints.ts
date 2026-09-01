
export const EFFECT_OPTIONS = ['PreferNoSchedule', 'NoExecute', 'NoSchedule'];

/**
 * Accepts an AKS node pool taint in string format and returns an object with key, value, and effect separated so it can be manipulated in the form.
 * @param taint AKS node pool taint in the format key=value:effect
 * @returns an object containing key, value, and effect keys
 */
export function parseTaint(taint: string): {key:string, value: string, effect: string} {
  const [key = '', value = '', effect = EFFECT_OPTIONS[0]] = taint.split(/:|=/);

  return {
    key, effect, value
  };
}

/**
 * Accepts key, value, and effect options -- separated to manipulate in the form -- and formats them into one string as the aks node pool spec requires.
 * @param key taint key
 * @param value taint value
 * @param effect taint effect - one of EFFECT_OPTIONS
 * @returns string in the format key=value:effect
 */
export function formatTaint(key = '', value = '', effect = EFFECT_OPTIONS[0]): string {
  return `${ key }=${ value }:${ effect || EFFECT_OPTIONS[0] }`;
}
