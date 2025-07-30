import type { Router } from 'vue-router';

export const CHART_README_STORAGE_KEY = 'chart-readme';

interface StandaloneReadmeOptions {
  storageKey: string;
  showAppReadme: boolean;
  hideReadmeFirstTitle: boolean;
  theme: string;
}

/**
 * Generates a URL for the standalone chart README page.
 * @param router The Vue router instance.
 * @param options
 * @param options.storageKey The key to retrieve the chart's version information from sessionStorage.
 * @param options.showAppReadme Determines if the app README(`versionInfo.appReadme`) is shown.
 * @param options.hideReadmeFirstTitle Determines if the first title in the README is hidden.
 * @param options.theme The theme to apply to the standalone page.
 * @returns The generated URL.
 */
export function getStandaloneReadmeUrl(router: Router, {
  storageKey, showAppReadme, hideReadmeFirstTitle, theme
}: StandaloneReadmeOptions): string {
  const { href } = router.resolve({
    name:   'chart-readme-standalone',
    params: { cluster: router.currentRoute.value.params.cluster },
    query:  {
      storageKey,
      showAppReadme:        String(showAppReadme),
      hideReadmeFirstTitle: String(hideReadmeFirstTitle),
      theme,
    },
  });

  return href;
}
