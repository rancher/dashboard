import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

// Two tables of one type on a page share that type in the store.
//
// The shell's paginated list assumes it is the only list of its type on screen: when it goes, it
// FORGETS the type - stops watching it and clears it from the store - which empties every other
// list showing it. A second table of the same type is an ordinary thing on a configurable page, so
// the tables of a type keep track of each other here, and when one leaves the rest are rebuilt and
// fetch again.

/** The tables showing each type, by key, as the call that rebuilds each one. */
const showing = new Map<string, Set<() => void>>();

/**
 * Join the tables showing `key` (null for none). The returned counter goes up whenever another
 * table of the same type leaves: put it in the table's key, so the table is rebuilt and fetches.
 */
export function useSharedTypeList(key: () => string | null): Ref<number> {
  const generation = ref(0);
  const rebuild = () => {
    generation.value += 1;
  };
  let current: string | null = null;

  function join(k: string | null): void {
    if (k) {
      const set = showing.get(k) || new Set();

      set.add(rebuild);
      showing.set(k, set);
    }
  }

  // The leaving table forgets the type as it unmounts, which has happened by the time this runs:
  // the others are rebuilt after it, not before.
  function leave(k: string | null): void {
    const set = k ? showing.get(k) : undefined;

    if (!k || !set) {
      return;
    }

    set.delete(rebuild);
    if (!set.size) {
      showing.delete(k);

      return;
    }
    setTimeout(() => set.forEach((fn) => fn()));
  }

  watch(key, (k) => {
    leave(current);
    current = k;
    join(k);
  }, { immediate: true });

  onBeforeUnmount(() => leave(current));

  return generation;
}
