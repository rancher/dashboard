import type { Router } from 'vue-router';

interface StandaloneReadmeOptions {
  versionInfo: object;
  showAppReadme: boolean;
  hideReadmeFirstTitle: boolean;
  theme: string;
}

/**
 * Generates a URL for the standalone chart README page.
 * @param router The Vue router instance.
 * @param options
 * @param options.versionInfo The chart's version information. This object is JSON-stringified and base64-encoded to be safely passed as a URL query parameter.
 * @param options.showAppReadme Determines if the app README(`versionInfo.appReadme`) is shown.
 * @param options.hideReadmeFirstTitle Determines if the first title in the README is hidden.
 * @param options.theme The theme to apply to the standalone page.
 * @returns The generated URL.
 */
export function getStandaloneReadmeUrl(router: Router, {
  versionInfo, showAppReadme, hideReadmeFirstTitle, theme
}: StandaloneReadmeOptions): string {
  const encodedVersionInfo = btoa(JSON.stringify(versionInfo));
  const { href } = router.resolve({
    name:   'chart-readme-standalone',
    params: { cluster: router.currentRoute.value.params.cluster },
    query:  {
      versionInfo:          encodedVersionInfo,
      showAppReadme:        String(showAppReadme),
      hideReadmeFirstTitle: String(hideReadmeFirstTitle),
      theme,
    },
  });

  return href;
}
