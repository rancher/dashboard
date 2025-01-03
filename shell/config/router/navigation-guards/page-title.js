import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';

export function install(router) {
  router.afterEach(updatePageTitleOnChange);
}

export async function updatePageTitleOnChange(to, from) {
  if (from?.name !== to?.name) {
    updatePageTitle(getVendor());
  }
}
