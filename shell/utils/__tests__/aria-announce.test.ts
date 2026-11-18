import {
  ANNOUNCE_POLITE,
  announce,
  initAriaAnnouncer,
  resetAriaAnnouncer,
} from '@shell/utils/aria-announce';

const CONTAINER_SELECTOR = '#aria-live-announcer';

const container = () => document.querySelector(CONTAINER_SELECTOR);

const nodes = (politeness: string) => Array.from(
  document.querySelectorAll<HTMLElement>(`${ CONTAINER_SELECTOR } [aria-live="${ politeness }"]`)
);

const texts = (politeness: string) => nodes(politeness).map((n) => n.textContent);

describe('util: aria-announce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetAriaAnnouncer();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    resetAriaAnnouncer();
    jest.useRealTimers();
  });

  describe('initAriaAnnouncer', () => {
    it('should put the polite live region in the DOM before anything is announced', () => {
      initAriaAnnouncer();

      expect(container()).not.toBeNull();
      expect(nodes(ANNOUNCE_POLITE)).toHaveLength(4);
    });

    it('should create the region empty, so the screen reader reads nothing on page load', () => {
      initAriaAnnouncer();

      expect(texts(ANNOUNCE_POLITE)).toStrictEqual(['', '', '', '']);
    });

    it('should give the region the roles and properties a screen reader needs', () => {
      initAriaAnnouncer();

      const [polite] = nodes(ANNOUNCE_POLITE);

      expect(polite.getAttribute('role')).toStrictEqual('status');
      expect(polite.getAttribute('aria-atomic')).toStrictEqual('true');
    });

    it('should not hide the regions in a way that drops them from the accessibility tree', () => {
      initAriaAnnouncer();

      const style = container()?.getAttribute('style') || '';

      expect(style).not.toContain('display:none');
      expect(style).not.toContain('visibility:hidden');
      expect(style).toContain('clip:rect(0,0,0,0)');
    });

    it('should be safe to call more than once', () => {
      initAriaAnnouncer();
      initAriaAnnouncer();

      expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
      expect(nodes(ANNOUNCE_POLITE)).toHaveLength(4);
    });
  });

  describe('announce', () => {
    it('should write the message into a polite region by default', () => {
      initAriaAnnouncer();
      announce('Copied');

      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toContain('Copied');
    });

    it('should not write immediately, giving the screen reader time to settle on the region', () => {
      initAriaAnnouncer();
      announce('Copied');

      expect(texts(ANNOUNCE_POLITE)).toStrictEqual(['', '', '', '']);

      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toContain('Copied');
    });

    it('should alternate nodes so the same message twice in a row is announced twice', () => {
      initAriaAnnouncer();

      announce('Copied');
      jest.runOnlyPendingTimers();
      const first = nodes(ANNOUNCE_POLITE).findIndex((n) => n.textContent === 'Copied');

      announce('Copied');
      jest.runOnlyPendingTimers();
      const second = nodes(ANNOUNCE_POLITE).findIndex((n) => n.textContent === 'Copied');

      expect(first).not.toStrictEqual(second);
      expect(texts(ANNOUNCE_POLITE).filter((t) => t === 'Copied')).toHaveLength(1);
    });

    it('should not suppress a repeated message that was announced in a prior action cycle', () => {
      // Regression: with 2 nodes, "Applying" always claims node0 and "Applied" always claims
      // node1. Without lastNodeForText tracking every cycle writes "Applied" to the same node,
      // and VoiceOver silently suppresses the repeat even after the node has been cleared.
      initAriaAnnouncer();

      announce('Applying');
      jest.runOnlyPendingTimers();
      announce('Applied');
      jest.runOnlyPendingTimers();
      const firstNode = nodes(ANNOUNCE_POLITE).findIndex((n) => n.textContent === 'Applied');

      announce('Applying');
      jest.runOnlyPendingTimers();
      announce('Applied');
      jest.runOnlyPendingTimers();
      const secondNode = nodes(ANNOUNCE_POLITE).findIndex((n) => n.textContent === 'Applied');

      expect(firstNode).not.toStrictEqual(secondNode);
    });

    it('should clear the text afterwards so it is not re-read from the virtual buffer', () => {
      initAriaAnnouncer();
      announce('Copied');

      // First pending timer is the write delay — text appears.
      jest.runOnlyPendingTimers();
      expect(texts(ANNOUNCE_POLITE)).toContain('Copied');

      // Second pending timer is the clear delay — text is gone.
      jest.runOnlyPendingTimers();
      expect(texts(ANNOUNCE_POLITE)).toStrictEqual(['', '', '', '']);
    });

    it.each([
      ['tags from a v-clean-html label', '<b>Created</b>', 'Created'],
      ['HTML entities', 'Creating&hellip;', 'Creating…'],
      ['surrounding whitespace', '  Applied  ', 'Applied'],
    ])('should resolve %s', (_label, message, expected) => {
      initAriaAnnouncer();
      announce(message);

      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toContain(expected);
    });

    it.each([
      ['an empty string', ''],
      ['whitespace only', '   '],
      ['markup with no text', '<span></span>'],
    ])('should say nothing for %s', (_label, message) => {
      initAriaAnnouncer();
      announce(message);

      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toStrictEqual(['', '', '', '']);
    });

    it('should replace a pending message rather than queue behind it', () => {
      initAriaAnnouncer();

      announce('Creating…');
      announce('Created');

      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toContain('Created');
      expect(texts(ANNOUNCE_POLITE)).not.toContain('Creating…');
    });

    // A UI Extension built against this @rancher/shell can run inside an older Rancher whose
    // startup never calls initAriaAnnouncer.
    it('should build the regions on demand when the host never initialised them', () => {
      announce('Copied');

      expect(container()).not.toBeNull();

      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toContain('Copied');
    });

    // A UI Extension carries its own copy of @rancher/shell with its own module state, so it
    // re-enters this code against a container the host already built.
    it('should adopt regions the host already created rather than add a second pair', () => {
      initAriaAnnouncer();

      // A fresh copy of the module, with its own state, is what the extension's bundle holds.
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@shell/utils/aria-announce').announce('Copied');
      });

      jest.runOnlyPendingTimers();

      expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
      expect(nodes(ANNOUNCE_POLITE)).toHaveLength(4);
      expect(texts(ANNOUNCE_POLITE)).toContain('Copied');
    });

    it('should rebuild a region that was torn out of the DOM', () => {
      initAriaAnnouncer();
      container()?.remove();

      announce('Copied');
      jest.runOnlyPendingTimers();

      expect(texts(ANNOUNCE_POLITE)).toContain('Copied');
    });
  });
});
