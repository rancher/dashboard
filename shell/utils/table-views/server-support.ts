/**
 * What the pagination api can filter and sort by beyond the fields it always offers, asked of the
 * server once per page load. An api without an index for a field answers a request naming it with
 * a 422 rather than ignoring the field, so a search naming it would fail whole
 */
import { ref } from 'vue';

import { MANAGEMENT } from '@shell/config/types';
import { DESCRIPTION } from '@shell/config/labels-annotations';

/** The path the api filters and sorts a description by - see STEVE_DESCRIPTION_ANNOTATION_COL */
export const DESCRIPTION_PATH = `metadata.annotations[${ DESCRIPTION }]`;

interface RequestSource {
  dispatch?: (action: string, payload: unknown) => Promise<unknown>;
}

/** null until the server has answered */
const descriptionIndexed = ref<boolean | null>(null);

let asked = false;

/** Features are listed by every user, so the answer doesn't depend on what the user can see */
function askServer(store: RequestSource) {
  asked = true;

  if (typeof store?.dispatch !== 'function') {
    descriptionIndexed.value = false;

    return;
  }

  const filter = encodeURIComponent(`${ DESCRIPTION_PATH }=x`);

  store.dispatch('management/request', { url: `/v1/${ MANAGEMENT.FEATURE }?pagesize=1&filter=${ filter }` })
    .then(() => {
      descriptionIndexed.value = true;
    })
    .catch(() => {
      descriptionIndexed.value = false;
    });
}

/**
 * Whether the api can filter and sort by the description annotation. False until the server says
 * so, so nothing asks for it before then; reactive, so a table asking again once it has is told
 */
export function canQueryDescription(store: RequestSource): boolean {
  if (!asked) {
    askServer(store);
  }

  return descriptionIndexed.value === true;
}

/** For tests: forget the answer, so the next question asks the server again */
export function resetServerSupport() {
  asked = false;
  descriptionIndexed.value = null;
}
