import { ref } from 'vue';

/** Per browser: whether the bar shows is a matter of taste, not something to sync between people. */
const STORAGE_KEY = 'configurable-views-bar-visible';

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Whether the view bar shows. Hidden until asked for, through the header button or its shortcut -
 * shared by both, so the button's pressed state follows the shortcut.
 */
export const viewBarVisible = ref(read());

export function toggleViewBar(): void {
  viewBarVisible.value = !viewBarVisible.value;

  try {
    window.localStorage.setItem(STORAGE_KEY, String(viewBarVisible.value));
  } catch {
    // Kept for this page load only
  }
}
