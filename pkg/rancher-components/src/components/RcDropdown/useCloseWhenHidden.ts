import { onBeforeUnmount, onMounted, watch } from 'vue';
import type { Ref } from 'vue';

/**
 * Closes an open menu once the element it is anchored to is no longer visible, eg when the row
 * holding its trigger is scrolled out of its scroll container. The menu isn't clipped by that
 * container, so it would otherwise keep floating over unrelated parts of the page.
 *
 * An IntersectionObserver without a root clips the element by the overflow of all its ancestors,
 * so it reports the element as hidden as soon as no part of it can be seen.
 */
export const useCloseWhenHidden = (
  isOpen: Ref<boolean>,
  anchor: () => Element | null | undefined,
  close: () => void,
) => {
  let observer: IntersectionObserver | null = null;

  const stop = () => {
    observer?.disconnect();
    observer = null;
  };

  const sync = (open: boolean) => {
    stop();

    const el = open ? anchor() : null;

    if (!el || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // An anchor without a size, eg an empty trigger slot of a menu opened through `open`,
    // can't be seen to begin with
    const { width, height } = el.getBoundingClientRect();

    if (!width && !height) {
      return;
    }

    observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) {
        close();
      }
    });
    observer.observe(el);
  };

  // A menu can already be open when it mounts, before the anchor exists
  onMounted(() => sync(isOpen.value));
  watch(isOpen, sync, { flush: 'post' });
  onBeforeUnmount(stop);
};
