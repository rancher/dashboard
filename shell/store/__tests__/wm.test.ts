import {
  state, getters, mutations, actions, State
} from '@shell/store/wm';
import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';
import { Tab } from '@shell/types/window-manager';
import { STORAGE_KEY } from '@shell/components/nav/WindowManager/constants';

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id:              'tab1',
    icon:            'icon',
    label:           'Tab 1',
    position:        BOTTOM as Tab['position'],
    layouts:         ['default'] as Tab['layouts'],
    showHeader:      true,
    containerHeight: null,
    containerWidth:  null,
    ...overrides,
  } as Tab;
}

describe('wm store', () => {
  let s: State;

  beforeEach(() => {
    localStorage.clear();
    s = state();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('state', () => {
    it('returns initial state with empty collections and null userPin', () => {
      expect(s.tabs).toStrictEqual([]);
      expect(s.active).toStrictEqual({});
      expect(s.open).toStrictEqual({});
      expect(s.userPin).toBeNull();
      expect(s.lockedPositions).toStrictEqual([]);
    });

    it('reads panelHeight for BOTTOM from localStorage on initialization', () => {
      localStorage.setItem(STORAGE_KEY[BOTTOM], '300');
      const fresh = state();

      expect(fresh.panelHeight[BOTTOM]).toStrictEqual('300');
    });

    it('reads panelWidth for LEFT and RIGHT from localStorage on initialization', () => {
      localStorage.setItem(STORAGE_KEY[LEFT], '250');
      localStorage.setItem(STORAGE_KEY[RIGHT], '350');
      const fresh = state();

      expect(fresh.panelWidth[LEFT]).toStrictEqual('250');
      expect(fresh.panelWidth[RIGHT]).toStrictEqual('350');
    });

    it('panelHeight and panelWidth are null when localStorage is empty', () => {
      expect(s.panelHeight[BOTTOM]).toBeNull();
      expect(s.panelWidth[LEFT]).toBeNull();
      expect(s.panelWidth[RIGHT]).toBeNull();
    });
  });

  describe('getters', () => {
    describe('byId', () => {
      it('returns the tab when id matches', () => {
        const tab = makeTab({ id: 'abc' });

        s.tabs = [tab];

        expect(getters.byId(s)('abc')).toStrictEqual(tab);
      });

      it('returns undefined when no tab matches the id', () => {
        s.tabs = [makeTab({ id: 'abc' })];

        expect(getters.byId(s)('xyz')).toBeUndefined();
      });
    });

    describe('tabs', () => {
      it('returns all tabs from state', () => {
        const tabs = [makeTab({ id: 'a' }), makeTab({ id: 'b' })];

        s.tabs = tabs;

        expect(getters.tabs(s)).toStrictEqual(tabs);
      });
    });

    describe('isOpen', () => {
      it('returns true when the position is open', () => {
        s.open = { [BOTTOM]: true };

        expect(getters.isOpen(s)(BOTTOM)).toBe(true);
      });

      it('returns false when the position is explicitly closed', () => {
        s.open = { [BOTTOM]: false };

        expect(getters.isOpen(s)(BOTTOM)).toBe(false);
      });

      it('returns undefined when the position is not in the open map', () => {
        expect(getters.isOpen(s)(BOTTOM)).toBeUndefined();
      });
    });

    describe('panelWidth', () => {
      it('returns the panelWidth map', () => {
        s.panelWidth = { [LEFT]: 250, [RIGHT]: 350 };

        expect(getters.panelWidth(s)).toStrictEqual({ [LEFT]: 250, [RIGHT]: 350 });
      });
    });

    describe('panelHeight', () => {
      it('returns the panelHeight map', () => {
        s.panelHeight = { [BOTTOM]: 300 };

        expect(getters.panelHeight(s)).toStrictEqual({ [BOTTOM]: 300 });
      });
    });

    describe('userPin', () => {
      it('returns the userPin from state', () => {
        s.userPin = LEFT;

        expect(getters.userPin(s)).toStrictEqual(LEFT);
      });
    });

    describe('lockedPositions', () => {
      it('returns the lockedPositions array', () => {
        s.lockedPositions = [BOTTOM as Tab['position']];

        expect(getters.lockedPositions(s)).toStrictEqual([BOTTOM]);
      });
    });
  });

  describe('mutations', () => {
    describe('addTab', () => {
      it('adds a new tab to the tabs array', () => {
        mutations.addTab(s, makeTab({ id: 'new-tab' }));

        expect(s.tabs).toHaveLength(1);
        expect(s.tabs[0].id).toStrictEqual('new-tab');
      });

      it('does not add a duplicate when a tab with the same id already exists', () => {
        s.tabs = [makeTab({ id: 'dup' })];
        mutations.addTab(s, makeTab({ id: 'dup' }));

        expect(s.tabs).toHaveLength(1);
      });

      it('sets position from localStorage pin when position is undefined', () => {
        localStorage.setItem(STORAGE_KEY['pin'], LEFT);
        const tab = makeTab({ id: 't1', position: undefined as any });

        mutations.addTab(s, tab);

        expect(s.tabs[0].position).toStrictEqual(LEFT);
      });

      it('sets position from localStorage pin when position is the string "undefined"', () => {
        localStorage.setItem(STORAGE_KEY['pin'], RIGHT);
        const tab = makeTab({ id: 't1', position: 'undefined' as any });

        mutations.addTab(s, tab);

        expect(s.tabs[0].position).toStrictEqual(RIGHT);
      });

      it('defaults position to BOTTOM when localStorage pin is empty and position is undefined', () => {
        const tab = makeTab({ id: 't1', position: undefined as any });

        mutations.addTab(s, tab);

        expect(s.tabs[0].position).toStrictEqual(BOTTOM);
      });

      it('defaults layouts to ["default"] when layouts is undefined', () => {
        const tab = makeTab({ id: 't1', layouts: undefined as any });

        mutations.addTab(s, tab);

        expect(s.tabs[0].layouts).toStrictEqual(['default']);
      });

      it('preserves existing layouts when provided', () => {
        const tab = makeTab({ id: 't1', layouts: ['home'] as Tab['layouts'] });

        mutations.addTab(s, tab);

        expect(s.tabs[0].layouts).toStrictEqual(['home']);
      });

      it('defaults showHeader to true when showHeader is undefined', () => {
        const tab = makeTab({ id: 't1', showHeader: undefined as any });

        mutations.addTab(s, tab);

        expect(s.tabs[0].showHeader).toBe(true);
      });

      it('preserves showHeader when explicitly set to false', () => {
        const tab = makeTab({ id: 't1', showHeader: false });

        mutations.addTab(s, tab);

        expect(s.tabs[0].showHeader).toBe(false);
      });

      it('sets active[position] to the tab id', () => {
        mutations.addTab(s, makeTab({ id: 't1', position: BOTTOM as Tab['position'] }));

        expect(s.active[BOTTOM]).toStrictEqual('t1');
      });

      it('sets open[position] to true', () => {
        mutations.addTab(s, makeTab({ id: 't1', position: BOTTOM as Tab['position'] }));

        expect(s.open[BOTTOM]).toBe(true);
      });

      it('sets userPin to the tab position', () => {
        mutations.addTab(s, makeTab({ id: 't1', position: LEFT as Tab['position'] }));

        expect(s.userPin).toStrictEqual(LEFT);
      });

      it('saves the pin position to localStorage', () => {
        mutations.addTab(s, makeTab({ id: 't1', position: RIGHT as Tab['position'] }));

        expect(localStorage.getItem(STORAGE_KEY['pin'])).toStrictEqual(RIGHT);
      });

      it('forces position to BOTTOM when BOTTOM is in lockedPositions', () => {
        s.lockedPositions = [BOTTOM as Tab['position']];
        const tab = makeTab({ id: 't1', position: LEFT as Tab['position'] });

        mutations.addTab(s, tab);

        expect(s.tabs[0].position).toStrictEqual(BOTTOM);
      });
    });

    describe('switchTab', () => {
      it('moves the tab to the target position', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.switchTab(s, { tabId: 't1', targetPosition: LEFT as Tab['position'] });

        expect(s.tabs[0].position).toStrictEqual(LEFT);
      });

      it('sets active[targetPosition] to the tab id', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.switchTab(s, { tabId: 't1', targetPosition: LEFT as Tab['position'] });

        expect(s.active[LEFT]).toStrictEqual('t1');
      });

      it('sets open[targetPosition] to true', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.switchTab(s, { tabId: 't1', targetPosition: LEFT as Tab['position'] });

        expect(s.open[LEFT]).toBe(true);
      });

      it('updates active[oldPosition] to the first remaining tab when moving to a different position', () => {
        s.tabs = [
          makeTab({ id: 't1', position: BOTTOM as Tab['position'] }),
          makeTab({ id: 't2', position: BOTTOM as Tab['position'] }),
        ];
        s.active = { [BOTTOM]: 't1' };
        mutations.switchTab(s, { tabId: 't1', targetPosition: LEFT as Tab['position'] });

        expect(s.active[BOTTOM]).toStrictEqual('t2');
      });

      it('sets open[oldPosition] to false when no tabs remain after switch', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        s.open = { [BOTTOM]: true };
        mutations.switchTab(s, { tabId: 't1', targetPosition: LEFT as Tab['position'] });

        expect(s.open[BOTTOM]).toBe(false);
      });

      it('sets userPin to targetPosition', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.switchTab(s, { tabId: 't1', targetPosition: RIGHT as Tab['position'] });

        expect(s.userPin).toStrictEqual(RIGHT);
      });

      it('saves targetPosition to localStorage', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.switchTab(s, { tabId: 't1', targetPosition: LEFT as Tab['position'] });

        expect(localStorage.getItem(STORAGE_KEY['pin'])).toStrictEqual(LEFT);
      });
    });

    describe('closeTab', () => {
      it('removes the tab from the tabs array', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.closeTab(s, { id: 't1' });

        expect(s.tabs).toHaveLength(0);
      });

      it('does nothing when the tab id is not found', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        mutations.closeTab(s, { id: 'unknown' });

        expect(s.tabs).toHaveLength(1);
      });

      it('sets open[position] to false when the last tab at that position is closed', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        s.open = { [BOTTOM]: true };
        mutations.closeTab(s, { id: 't1' });

        expect(s.open[BOTTOM]).toBe(false);
      });

      it('updates active[position] to the first remaining tab after close', () => {
        s.tabs = [
          makeTab({ id: 't1', position: BOTTOM as Tab['position'] }),
          makeTab({ id: 't2', position: BOTTOM as Tab['position'] }),
        ];
        s.active = { [BOTTOM]: 't2' };
        mutations.closeTab(s, { id: 't2' });

        expect(s.active[BOTTOM]).toStrictEqual('t1');
      });

      it('clears active[position] to empty string when the last tab is closed', () => {
        s.tabs = [makeTab({ id: 't1', position: BOTTOM as Tab['position'] })];
        s.active = { [BOTTOM]: 't1' };
        mutations.closeTab(s, { id: 't1' });

        expect(s.active[BOTTOM]).toStrictEqual('');
      });
    });

    describe('removeTab', () => {
      it('removes the exact tab reference from the tabs array', () => {
        const tab = makeTab({ id: 't1' });

        s.tabs = [tab];
        mutations.removeTab(s, tab);

        expect(s.tabs).toHaveLength(0);
      });
    });

    describe('setOpen', () => {
      it('sets open[position] to true', () => {
        mutations.setOpen(s, { position: BOTTOM, open: true });

        expect(s.open[BOTTOM]).toBe(true);
      });

      it('sets open[position] to false', () => {
        s.open = { [BOTTOM]: true };
        mutations.setOpen(s, { position: BOTTOM, open: false });

        expect(s.open[BOTTOM]).toBe(false);
      });
    });

    describe('setActive', () => {
      it('sets active[position] to the given id', () => {
        mutations.setActive(s, { position: BOTTOM, id: 'tab-id' });

        expect(s.active[BOTTOM]).toStrictEqual('tab-id');
      });
    });

    describe('setPanelHeight', () => {
      it('sets panelHeight for the position', () => {
        mutations.setPanelHeight(s, { position: BOTTOM, height: 300 });

        expect(s.panelHeight[BOTTOM]).toStrictEqual(300);
      });

      it('saves height to localStorage', () => {
        mutations.setPanelHeight(s, { position: BOTTOM, height: 400 });

        expect(localStorage.getItem(STORAGE_KEY[BOTTOM])).toStrictEqual('400');
      });

      it('updates containerHeight only for tabs at that position', () => {
        s.tabs = [
          makeTab({
            id: 't1', position: BOTTOM as Tab['position'], containerHeight: null
          }),
          makeTab({
            id: 't2', position: LEFT as Tab['position'], containerHeight: null
          }),
        ];
        mutations.setPanelHeight(s, { position: BOTTOM, height: 300 });

        expect(s.tabs[0].containerHeight).toStrictEqual(300);
        expect(s.tabs[1].containerHeight).toBeNull();
      });
    });

    describe('setPanelWidth', () => {
      it('sets panelWidth for the position', () => {
        mutations.setPanelWidth(s, { position: LEFT as Tab['position'], width: 250 });

        expect(s.panelWidth[LEFT]).toStrictEqual(250);
      });

      it('saves width to localStorage', () => {
        mutations.setPanelWidth(s, { position: RIGHT as Tab['position'], width: 300 });

        expect(localStorage.getItem(STORAGE_KEY[RIGHT])).toStrictEqual('300');
      });

      it('updates containerWidth only for tabs at that position', () => {
        s.tabs = [
          makeTab({
            id: 't1', position: LEFT as Tab['position'], containerWidth: null
          }),
          makeTab({
            id: 't2', position: RIGHT as Tab['position'], containerWidth: null
          }),
        ];
        mutations.setPanelWidth(s, { position: LEFT as Tab['position'], width: 250 });

        expect(s.tabs[0].containerWidth).toStrictEqual(250);
        expect(s.tabs[1].containerWidth).toBeNull();
      });
    });

    describe('setUserPin', () => {
      it('sets userPin to the given value', () => {
        mutations.setUserPin(s, LEFT);

        expect(s.userPin).toStrictEqual(LEFT);
      });

      it('saves the pin to localStorage', () => {
        mutations.setUserPin(s, RIGHT);

        expect(localStorage.getItem(STORAGE_KEY['pin'])).toStrictEqual(RIGHT);
      });
    });

    describe('setLockedPositions', () => {
      it('replaces lockedPositions with the given array', () => {
        mutations.setLockedPositions(s, [BOTTOM as Tab['position'], LEFT as Tab['position']]);

        expect(s.lockedPositions).toStrictEqual([BOTTOM, LEFT]);
      });
    });
  });

  describe('actions', () => {
    let commit: jest.Mock;

    beforeEach(() => {
      commit = jest.fn();
    });

    describe('close', () => {
      it('throws when id is not provided', () => {
        expect(() => actions.close({
          commit, state: s, getters: {}
        }, '')).toThrow('[wm] id is not provided');
      });

      it('commits closeTab with the given id', () => {
        actions.close({
          commit, state: s, getters: {}
        }, 'tab-id');

        expect(commit).toHaveBeenCalledWith('closeTab', { id: 'tab-id' });
      });
    });

    describe('open', () => {
      it('throws when tab has no id', () => {
        expect(() => actions.open({ commit }, makeTab({ id: '' }))).toThrow('[wm] id is not provided');
      });

      it('commits addTab with the given tab', () => {
        const tab = makeTab({ id: 'new-tab' });

        actions.open({ commit }, tab);

        expect(commit).toHaveBeenCalledWith('addTab', tab);
      });
    });
  });
});
