// I grabbed the source code of this plugin from https://github.com/rodrigopv/vue3-shortkey
//
// At the time of writing this the released plugin was emitting debug console messages and
// there was a PR open for about 1 year to address this https://github.com/rodrigopv/vue3-shortkey/pull/1
// If another library becomes available I think we should use it instead
import 'element-matches';
import 'custom-event-polyfill';

const ShortKey = {};
const mapFunctions = {};
let objAvoided = [];
let elementAvoided = [];
let containerAvoided = [];
let keyPressed = false;

const parseValue = (value) => {
  value = typeof value === 'string' ? JSON.parse(value.replace(/\'/gi, '"')) : value;
  if (value instanceof Array) {
    return { '': value };
  }

  return value;
};

const bindValue = (value, el, binding, vnode) => {
  const push = binding.modifiers.push === true;
  // `hold` reveals while the key is held: it reports ABSOLUTE state (detail.held true on keydown, false on
  // keyup / focus loss) and never preventDefaults, so it can't swallow a bare modifier like Alt. This is
  // the reliable replacement for `push`, whose toggle-on-both-edges desynced on focus loss (issue 11329).
  const hold = binding.modifiers.hold === true;
  const avoid = binding.modifiers.avoid === true;
  const focus = !binding.modifiers.focus === true;
  const once = binding.modifiers.once === true;
  const propagte = binding.modifiers.propagte === true;

  if (avoid) {
    objAvoided = objAvoided.filter((itm) => {
      return !itm === el;
    });
    objAvoided.push(el);
  } else {
    mappingFunctions({
      b: value, push, once, focus, propagte, hold, el: vnode.el
    });
  }
};

const unbindValue = (value, el) => {
  for (const key in value) {
    const k = ShortKey.encodeKey(value[key]);
    const idxElm = mapFunctions[k].el.indexOf(el);

    if (mapFunctions[k].el.length > 1 && idxElm > -1) {
      mapFunctions[k].el.splice(idxElm, 1);
    } else {
      delete mapFunctions[k];
    }
  }
};

ShortKey.install = (Vue, options) => {
  elementAvoided = [...(options && options.prevent ? options.prevent : [])];
  containerAvoided = [...(options && options.preventContainer ? options.preventContainer : [])];
  Vue.directive('shortkey', {
    beforeMount: (el, binding, vnode) => {
      // Mapping the commands
      const value = parseValue(binding.value);

      bindValue(value, el, binding, vnode);
    },
    updated: (el, binding, vnode) => {
      const oldValue = parseValue(binding.oldValue);

      unbindValue(oldValue, el);

      const newValue = parseValue(binding.value);

      bindValue(newValue, el, binding, vnode);
    },
    unmounted: (el, binding) => {
      const value = parseValue(binding.value);

      unbindValue(value, el);
    }
  });
};

ShortKey.decodeKey = (pKey) => createShortcutIndex(pKey);
ShortKey.encodeKey = (pKey) => {
  const shortKey = {};

  shortKey.shiftKey = pKey.includes('shift');
  shortKey.ctrlKey = pKey.includes('ctrl');
  shortKey.metaKey = pKey.includes('meta');
  shortKey.altKey = pKey.includes('alt');
  let indexedKeys = createShortcutIndex(shortKey);
  const vKey = pKey.filter((item) => !['shift', 'ctrl', 'meta', 'alt'].includes(item));

  indexedKeys += vKey.join('');

  return indexedKeys;
};

const createShortcutIndex = (pKey) => {
  let k = '';

  if (pKey.key === 'Shift' || pKey.shiftKey) {
    k += 'shift';
  }
  if (pKey.key === 'Control' || pKey.ctrlKey) {
    k += 'ctrl';
  }
  if (pKey.key === 'Meta' || pKey.metaKey) {
    k += 'meta';
  }
  if (pKey.key === 'Alt' || pKey.altKey) {
    k += 'alt';
  }
  if (pKey.key === 'ArrowUp') {
    k += 'arrowup';
  }
  if (pKey.key === 'ArrowLeft') {
    k += 'arrowleft';
  }
  if (pKey.key === 'ArrowRight') {
    k += 'arrowright';
  }
  if (pKey.key === 'ArrowDown') {
    k += 'arrowdown';
  }
  if (pKey.key === 'AltGraph') {
    k += 'altgraph';
  }
  if (pKey.key === 'Escape') {
    k += 'esc';
  }
  if (pKey.key === 'Enter') {
    k += 'enter';
  }
  if (pKey.key === 'Tab') {
    k += 'tab';
  }
  if (pKey.key === ' ') {
    k += 'space';
  }
  if (pKey.key === 'PageUp') {
    k += 'pageup';
  }
  if (pKey.key === 'PageDown') {
    k += 'pagedown';
  }
  if (pKey.key === 'Home') {
    k += 'home';
  }
  if (pKey.key === 'End') {
    k += 'end';
  }
  if (pKey.key === 'Delete') {
    k += 'del';
  }
  if (pKey.key === 'Backspace') {
    k += 'backspace';
  }
  if (pKey.key === 'Insert') {
    k += 'insert';
  }
  if (pKey.key === 'NumLock') {
    k += 'numlock';
  }
  if (pKey.key === 'CapsLock') {
    k += 'capslock';
  }
  if (pKey.key === 'Pause') {
    k += 'pause';
  }
  if (pKey.key === 'ContextMenu') {
    k += 'contextmenu';
  }
  if (pKey.key === 'ScrollLock') {
    k += 'scrolllock';
  }
  if (pKey.key === 'BrowserHome') {
    k += 'browserhome';
  }
  if (pKey.key === 'MediaSelect') {
    k += 'mediaselect';
  }
  if ((pKey.key && pKey.key !== ' ' && pKey.key.length === 1) || /F\d{1,2}|\//g.test(pKey.key)) k += pKey.key.toLowerCase();

  return k;
};

const dispatchShortkeyEvent = (pKey) => {
  const e = new CustomEvent('shortkey', { bubbles: false });

  if (mapFunctions[pKey].key) e.srcKey = mapFunctions[pKey].key;
  const elm = mapFunctions[pKey].el;

  if (!mapFunctions[pKey].propagte) {
    elm[elm.length - 1].dispatchEvent(e);
  } else {
    elm.forEach((elmItem) => elmItem.dispatchEvent(e));
  }
};

// --- hold modifier (issue 11329) ---

// Dispatch the `shortkey` event carrying ABSOLUTE state in `detail.held`, so a hold consumer assigns state
// directly (no toggle). Mirrors dispatchShortkeyEvent's propagate / last-element targeting.
const dispatchHoldEvent = (pKey, held) => {
  const fn = mapFunctions[pKey];

  if (!fn) {
    return;
  }

  const makeEvent = () => {
    const e = new CustomEvent('shortkey', { detail: { held }, bubbles: false });

    if (fn.key) {
      e.srcKey = fn.key;
    }

    return e;
  };

  if (!fn.propagte) {
    fn.el[fn.el.length - 1].dispatchEvent(makeEvent());
  } else {
    fn.el.forEach((elmItem) => elmItem.dispatchEvent(makeEvent()));
  }
};

// A hold binding observes only: it NEVER preventDefaults (so a bare modifier like Alt keeps its native
// behaviour) and does no focus handling. Returns true when `decodedKey` is a hold binding, so the caller
// skips the normal shortkey path.
const handleHoldKeydown = (decodedKey) => {
  const fn = mapFunctions[decodedKey];

  if (!fn || !fn.hold) {
    return false;
  }
  if (!fn.held) {
    fn.held = true;
    dispatchHoldEvent(decodedKey, true);
  }

  return true;
};

const handleHoldKeyup = (decodedKey) => {
  const fn = mapFunctions[decodedKey];

  if (!fn || !fn.hold) {
    return false;
  }
  if (fn.held) {
    fn.held = false;
    dispatchHoldEvent(decodedKey, false);
  }

  return true;
};

// Focus / visibility loss releases every held binding: once focus leaves the page the keyup that would
// clear it never arrives, so this is the reliable release.
const releaseHeldKeys = () => {
  Object.keys(mapFunctions).forEach((k) => {
    const fn = mapFunctions[k];

    if (fn.hold && fn.held) {
      fn.held = false;
      dispatchHoldEvent(k, false);
    }
  });
};

ShortKey.keyDown = (pKey) => {
  if ((!mapFunctions[pKey].once && !mapFunctions[pKey].push) || (mapFunctions[pKey].push && !keyPressed)) {
    dispatchShortkeyEvent(pKey);
  }
};

if (process && process.env && process.env.NODE_ENV !== 'test') {
  (function() {
    document.addEventListener('keydown', (pKey) => {
      const decodedKey = ShortKey.decodeKey(pKey);

      // Hold bindings observe only — handled before the avoid/preventDefault path so they never swallow
      // the key (a bare Alt keeps its native behaviour) and aren't gated by the focus/avoid list.
      if (handleHoldKeydown(decodedKey)) {
        return;
      }

      // Check avoidable elements
      if (availableElement(decodedKey)) {
        if (!mapFunctions[decodedKey].propagte) {
          pKey.preventDefault();
          pKey.stopPropagation();
        }
        if (mapFunctions[decodedKey].focus) {
          ShortKey.keyDown(decodedKey);
          keyPressed = true;
        } else if (!keyPressed) {
          const elm = mapFunctions[decodedKey].el;

          elm[elm.length - 1].focus();
          keyPressed = true;
        }
      }
    }, true);

    document.addEventListener('keyup', (pKey) => {
      const decodedKey = ShortKey.decodeKey(pKey);

      if (handleHoldKeyup(decodedKey)) {
        return;
      }

      if (availableElement(decodedKey)) {
        if (!mapFunctions[decodedKey].propagte) {
          pKey.preventDefault();
          pKey.stopPropagation();
        }
        if (mapFunctions[decodedKey].once || mapFunctions[decodedKey].push) {
          dispatchShortkeyEvent(decodedKey);
        }
      }
      keyPressed = false;
    }, true);

    // A hold reveal must clear when focus leaves the page — the keyup that would release it never arrives
    // once focus moves away (clicking the URL bar, alt-tabbing).
    window.addEventListener('blur', releaseHeldKeys);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        releaseHeldKeys();
      }
    });
  })();
}

const mappingFunctions = ({
  b, push, once, focus, propagte, hold, el
}) => {
  for (const key in b) {
    const k = ShortKey.encodeKey(b[key]);
    const existing = mapFunctions[k];
    const elm = existing && existing.el ? existing.el : [];
    const propagated = existing && existing.propagte;

    elm.push(el);
    mapFunctions[k] = {
      push,
      once,
      focus,
      hold,
      key,
      // Preserve any in-progress held state across a re-bind so a re-render mid-hold doesn't reset it.
      held:     existing ? existing.held : false,
      propagte: propagated || propagte,
      el:       elm
    };
  }
};

const availableElement = (decodedKey) => {
  const objectIsAvoided = !!objAvoided.find((r) => r === document.activeElement);
  const filterAvoided = !!(elementAvoided.find((selector) => document.activeElement && document.activeElement.matches(selector)));
  const filterAvoidedContainer = !!(containerAvoided.find((selector) => isActiveElementChildOf(selector)));

  return !!mapFunctions[decodedKey] && !(objectIsAvoided || filterAvoided) && !filterAvoidedContainer;
};

const isActiveElementChildOf = (container) => {
  const activeElement = document.activeElement;

  return activeElement && activeElement.closest(container) !== null;
};

export default ShortKey;

// Exposed for unit tests — the global keydown/keyup listeners above are disabled under NODE_ENV=test, so
// tests drive the hold logic through these directly (mapFunctions is the registry the directive fills).
export const _internal = {
  mapFunctions, handleHoldKeydown, handleHoldKeyup, releaseHeldKeys, dispatchHoldEvent
};
