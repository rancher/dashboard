import { PerfSettingsWarningHeaders } from '@shell/config/settings';
import { getPerformanceSetting } from '@shell/utils/settings';

interface HttpResponse {
  headers?: { [key: string]: string},
  data?: any,
  config: {
    url: string,
  }
}

/**
 * Cache the kube api warning header settings that will determine if they are growled or not
 */
let warningHeaderSettings: PerfSettingsWarningHeaders;

/**
 * Extract sanitised warnings from the warnings header string
 */
function kubeApiHeaderWarnings(allWarnings: string): string[] {
  // Find each warning.
  // Each warning is separated by `,`... however... this can appear within the warning itself so can't `split` on it
  // Instead provide a configurable way to split (default 299 - )
  const warnings = allWarnings.split(warningHeaderSettings.separator) || [];

  // Trim and remove effects of split
  return warnings.reduce((res, warning) => {
    const trimmedWarning = warning.trim();

    if (!trimmedWarning) {
      return res;
    }

    const fixedWarning = trimmedWarning.endsWith(',') ? trimmedWarning.slice(0, -1) : trimmedWarning;

    // Why add the separator again? It's almost certainly `299 - ` which is important info to include
    res.push(warningHeaderSettings.separator + fixedWarning);

    return res;
  }, [] as string[]);
}

/**
 * Take action given the `warnings` in the response header of a kube api request
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function handleKubeApiHeaderWarnings(res: HttpResponse, dispatch: any, rootGetters: any, method: string, refreshCache = false): void {
  const safeMethod = method?.toLowerCase(); // Some requests have this as uppercase

  // Exit early if there's no warnings
  if ((safeMethod !== 'post' && safeMethod !== 'put') || !res.headers?.warning) {
    return;
  }

  // Grab the required settings
  if (!warningHeaderSettings || refreshCache) {
    const settings = getPerformanceSetting(rootGetters);

    // Cache this, we don't need to react to changes within the same session
    warningHeaderSettings = settings?.kubeAPI.warningHeader;
  }

  // Determine each warning
  const sanitisedWarnings = kubeApiHeaderWarnings(res.headers?.warning);

  if (!sanitisedWarnings.length) {
    return;
  }

  // Shows warnings as growls
  const growlWarnings = sanitisedWarnings.filter((w) => !warningHeaderSettings.notificationBlockList.find((blocked) => w.startsWith(blocked)));

  if (growlWarnings.length) {
    const resourceType = res.data?.type || res.data?.kind || rootGetters['i18n/t']('generic.resource', { count: 1 });

    dispatch('growl/warning', {
      title:   method === 'put' ? rootGetters['i18n/t']('growl.kubeApiHeaderWarning.titleUpdate', { resourceType }) : rootGetters['i18n/t']('growl.kubeApiHeaderWarning.titleCreate', { resourceType }),
      message: growlWarnings.join(', '),
      timeout: 0,
    }, { root: true });
  }

  // Print warnings to console
  const message = `Validation Warnings for ${ res.config.url }\n\n${ sanitisedWarnings.join('\n') }`;

  if (process.env.dev) {
    console.warn(`${ message }\n\n`, res.data); // eslint-disable-line no-console
  } else {
    console.debug(message); // eslint-disable-line no-console
  }
}
