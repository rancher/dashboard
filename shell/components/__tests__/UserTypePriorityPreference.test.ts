import { flushPromises, mount } from '@vue/test-utils';
import UserTypePriorityPreference from '@shell/components/UserTypePriorityPreference.vue';
import { UserTypePreferences } from '@shell/apis/intf/shell';

// useI18n is mocked for every spec (jest.setup.js): t gives `key-{args as JSON}`
const userType = (name: string) => ({ metadata: { name }, spec: { displayName: name.toUpperCase() } });

/**
 * A stand in for `$shell.userTypes`: the user's user types in order, and their preferences
 */
function createApi(names: string[], preferences: UserTypePreferences = {}) {
  const state = { preferences };

  return {
    state,
    currentUserTypes:              jest.fn(() => Promise.resolve(names.map(userType))),
    currentUserTypePreferences:    jest.fn(() => state.preferences),
    setCurrentUserTypePreferences: jest.fn((value: UserTypePreferences) => {
      state.preferences = value;

      return Promise.resolve();
    }),
    setCurrentUserTypeEnabled: jest.fn(() => Promise.resolve()),
    reorderCurrentUserTypes:   jest.fn(() => Promise.resolve()),
  };
}

async function load(api: ReturnType<typeof createApi>) {
  const wrapper = mount(UserTypePriorityPreference, { attachTo: document.body, global: globalFor(api) });

  await flushPromises();

  return wrapper;
}

function globalFor(api: ReturnType<typeof createApi>) {
  return {
    provide:    { $shell: { userTypes: api } },
    directives: { cleanTooltip: {} },
  };
}

const rowNames = (wrapper: Awaited<ReturnType<typeof load>>) => wrapper.findAll('[data-user-type]').map((row) => row.attributes('data-user-type'));
const row = (wrapper: Awaited<ReturnType<typeof load>>, name: string) => wrapper.find(`[data-user-type="${ name }"]`);

describe('component: UserTypePriorityPreference', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('on mount', () => {
    it('should drop preferences for user types that were deleted or aren\'t the user\'s, keep disabled ones, and save before listing', async() => {
      const api = createApi(['a', 'b'], {
        a: { priority: 1 }, b: { disabled: true }, gone: { priority: 2 }
      });

      await load(api);

      expect(api.setCurrentUserTypePreferences).toHaveBeenCalledWith({ a: { priority: 1 }, b: { disabled: true } });
      expect(api.setCurrentUserTypePreferences.mock.invocationCallOrder[0]).toBeLessThan(api.currentUserTypes.mock.invocationCallOrder[1]);
    });

    it('should save nothing when nothing is stale', async() => {
      const api = createApi(['a'], { a: { priority: 1 } });

      await load(api);

      expect(api.setCurrentUserTypePreferences).not.toHaveBeenCalled();
    });
  });

  it('should list the user types in order, disabled ones included', async() => {
    const api = createApi(['b', 'a', 'c'], { a: { disabled: true } });
    const wrapper = await load(api);

    expect(rowNames(wrapper)).toStrictEqual(['b', 'a', 'c']);
    // The last call is the list's, the first is the clean up on mount
    expect(api.currentUserTypes).toHaveBeenLastCalledWith({ includeDisabled: true });
  });

  describe('turning a user type off and on', () => {
    it('should make each row a checkbox, ticked with a checkmark only when enabled', async() => {
      const wrapper = await load(createApi(['a', 'b'], { b: { disabled: true } }));

      expect(row(wrapper, 'a').attributes()).toStrictEqual(expect.objectContaining({ role: 'checkbox', 'aria-checked': 'true' }));
      expect(row(wrapper, 'b').attributes('aria-checked')).toBe('false');
      expect(row(wrapper, 'a').find('.usertype-check').element.children).toHaveLength(1);
      expect(row(wrapper, 'b').find('.usertype-check').element.children).toHaveLength(0);
    });

    it.each([
      ['a click', (el: ReturnType<typeof row>) => el.trigger('click')],
      ['Space', (el: ReturnType<typeof row>) => el.trigger('keydown', { key: ' ', code: 'Space' })],
      ['Enter', (el: ReturnType<typeof row>) => el.trigger('keydown', { key: 'Enter' })],
    ])('should toggle a row on %s', async(_, act) => {
      const api = createApi(['a', 'b'], { b: { disabled: true } });
      const wrapper = await load(api);

      await act(row(wrapper, 'a'));
      await act(row(wrapper, 'b'));

      expect(api.setCurrentUserTypeEnabled.mock.calls).toStrictEqual([['a', false], ['b', true]]);
    });

    it('should not toggle a row on Alt+arrows', async() => {
      const api = createApi(['a', 'b']);
      const wrapper = await load(api);

      await row(wrapper, 'a').trigger('keydown', { key: 'ArrowDown', altKey: true });
      await row(wrapper, 'b').trigger('keydown', { key: 'ArrowUp', altKey: true });

      expect(api.setCurrentUserTypeEnabled).not.toHaveBeenCalled();
    });
  });

  describe('reordering', () => {
    it('should move a row with Alt+Down and say where it went, and not past the ends', async() => {
      const api = createApi(['a', 'b', 'c']);
      const wrapper = await load(api);

      await row(wrapper, 'a').trigger('keydown', { key: 'ArrowDown', altKey: true });
      await flushPromises();

      expect(api.reorderCurrentUserTypes).toHaveBeenCalledWith(['b', 'a', 'c']);
      expect(wrapper.find('[data-testid="prefs__user-types-announcement"]').text()).toBe('prefs.userTypes.moved-{"label":"A","position":2,"total":3}');

      await row(wrapper, 'a').trigger('keydown', { key: 'ArrowUp', altKey: true });
      await row(wrapper, 'c').trigger('keydown', { key: 'ArrowDown', altKey: true });

      expect(api.reorderCurrentUserTypes).toHaveBeenCalledTimes(1);
    });

    it('should save the order a drag leaves', async() => {
      const api = createApi(['a', 'b', 'c']);
      const wrapper = await load(api);

      await wrapper.find('[data-testid="prefs__user-types-handle-a"]').trigger('mousedown', { button: 0, clientY: 0 });
      // jsdom lays nothing out, so every row measures 0 high: anywhere below the list is past its end
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 50 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
      await flushPromises();

      expect(api.reorderCurrentUserTypes).toHaveBeenCalledWith(['b', 'c', 'a']);
    });
  });

  describe('reset', () => {
    it('should only be offered when the user has preferences', async() => {
      expect((await load(createApi(['a']))).find('[data-testid="prefs__user-types-reset"]').exists()).toBe(false);
      expect((await load(createApi(['a'], { a: { disabled: true } }))).find('[data-testid="prefs__user-types-reset"]').exists()).toBe(true);
    });

    it('should save no preferences and say so', async() => {
      const api = createApi(['a'], { a: { disabled: true } });
      const wrapper = await load(api);

      await wrapper.find('[data-testid="prefs__user-types-reset"]').trigger('click');
      await flushPromises();

      expect(api.setCurrentUserTypePreferences).toHaveBeenLastCalledWith({});
      expect(wrapper.find('[data-testid="prefs__user-types-announcement"]').text()).toBe('prefs.userTypes.resetDone');
    });
  });

  it('should show a spinner until loaded, then the empty text when the user has no user types', async() => {
    const api = createApi([]);
    const wrapper = mount(UserTypePriorityPreference, { global: globalFor(api) });

    expect(wrapper.find('.icon-spinner').exists()).toBe(true);

    await flushPromises();

    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
    expect(wrapper.find('[data-testid="prefs__user-types-empty"]').text()).toContain('prefs.userTypes.empty');
  });
});
