import { state, getters, mutations, actions } from '../ui-context';

describe('ui-context store', () => {
  describe('state', () => {
    it('returns initial state with empty elements and zero idCounter', () => {
      expect(state()).toStrictEqual({ idCounter: 0, elements: {} });
    });

    it('returns a fresh object on each call', () => {
      const s1 = state();
      const s2 = state();

      expect(s1).not.toBe(s2);
    });
  });

  describe('getters', () => {
    describe('all', () => {
      it('returns empty array when no elements exist', () => {
        expect(getters.all(state())).toStrictEqual([]);
      });

      it('returns contexts sorted alphabetically by tag', () => {
        const s = state();

        s.elements = {
          1: { id: 1, context: { tag: 'z-tag', value: 'a' } },
          2: { id: 2, context: { tag: 'a-tag', value: 'b' } },
          3: { id: 3, context: { tag: 'm-tag', value: 'c' } },
        } as any;

        const result = getters.all(s);

        expect(result.map((c: any) => c.tag)).toStrictEqual(['a-tag', 'm-tag', 'z-tag']);
      });

      it('sorts contexts without tag before tagged contexts', () => {
        const s = state();

        s.elements = {
          1: { id: 1, context: { tag: 'b-tag', value: 'a' } },
          2: { id: 2, context: { value: 'b' } },
        } as any;

        const result = getters.all(s);

        expect(result[0]).toStrictEqual({ value: 'b' });
        expect(result[1].tag).toBe('b-tag');
      });

      it('returns context objects, not full element wrappers', () => {
        const context = { tag: 'my-tag', value: 'test-val' };
        const s = state();

        s.elements = { 1: { id: 1, context } } as any;

        expect(getters.all(s)).toStrictEqual([context]);
      });
    });
  });

  describe('mutations', () => {
    describe('add', () => {
      it('adds element to state', () => {
        const s = state();
        const element = { id: 1, context: { tag: 'test', value: 'val' } };

        mutations.add(s, element);

        expect(s.elements[1]).toStrictEqual(element);
      });

      it('adds multiple elements without overwriting', () => {
        const s = state();
        const e1 = { id: 1, context: { tag: 'a', value: 1 } };
        const e2 = { id: 2, context: { tag: 'b', value: 2 } };

        mutations.add(s, e1);
        mutations.add(s, e2);

        expect(Object.keys(s.elements)).toStrictEqual(['1', '2']);
      });
    });

    describe('update', () => {
      it('updates context of existing element', () => {
        const s = state();

        s.elements[1] = { id: 1, context: { tag: 'test', value: 'original' } };
        mutations.update(s, { id: 1, context: { tag: 'test', value: 'updated' } });

        expect(s.elements[1].context).toStrictEqual({ tag: 'test', value: 'updated' });
      });

      it('does nothing when element id is not found', () => {
        const s = state();
        const element = { id: 1, context: { tag: 'test', value: 'val' } };

        s.elements[1] = element;
        mutations.update(s, { id: 999, context: { tag: 'other', value: 'new' } });

        expect(s.elements[1]).toStrictEqual(element);
      });
    });

    describe('remove', () => {
      it('removes element from state by id', () => {
        const s = state();
        const element = { id: 1, context: { tag: 'test', value: 'val' } };

        s.elements[1] = element;
        mutations.remove(s, element);

        expect(s.elements[1]).toBeUndefined();
      });

      it('leaves other elements intact when removing one', () => {
        const s = state();
        const e1 = { id: 1, context: { tag: 'a', value: 1 } };
        const e2 = { id: 2, context: { tag: 'b', value: 2 } };

        s.elements[1] = e1;
        s.elements[2] = e2;
        mutations.remove(s, e1);

        expect(s.elements[2]).toStrictEqual(e2);
      });
    });
  });

  describe('actions', () => {
    const makeStore = () => {
      const s = state() as any;
      const commit = jest.fn((mutation: string, payload: any) => {
        (mutations as any)[mutation](s, payload);
      });

      return { s, commit };
    };

    describe('add', () => {
      it.each([
        {
          desc: 'undefined context',
          ctx:  undefined as any,
        },
        {
          desc: 'null context',
          ctx:  null as any,
        },
        {
          desc: 'missing tag property',
          ctx:  { value: 'something' } as any,
        },
        {
          desc: 'empty string tag',
          ctx:  { value: 'something', tag: '' } as any,
        },
        {
          desc: 'missing value property',
          ctx:  { tag: 'test' } as any,
        },
        {
          desc: 'explicit undefined value',
          ctx:  { tag: 'test', value: undefined } as any,
        },
      ])('throws for invalid context: $desc', ({ ctx }) => {
        const { s, commit } = makeStore();

        expect(() => actions.add({ commit, state: s }, ctx)).toThrow('[ui-context]');
      });

      it('commits add and returns generated id for valid context', () => {
        const { s, commit } = makeStore();
        const ctx = { tag: 'my-tag', value: 'my-value' };

        const id = actions.add({ commit, state: s }, ctx);

        expect(id).toBe('ctx-0');
        expect(commit).toHaveBeenCalledWith('add', { id: 'ctx-0', context: ctx });
      });

      it('increments idCounter on successive calls', () => {
        const { s, commit } = makeStore();
        const ctx = { tag: 't', value: 'v' };

        const id1 = actions.add({ commit, state: s }, ctx);
        const id2 = actions.add({ commit, state: s }, ctx);

        expect(id1).toBe('ctx-0');
        expect(id2).toBe('ctx-1');
      });

      it.each([
        {
          desc: 'null value',
          ctx:  { tag: 'test', value: null },
        },
        {
          desc: 'false value',
          ctx:  { tag: 'test', value: false },
        },
        {
          desc: 'zero value',
          ctx:  { tag: 'test', value: 0 },
        },
        {
          desc: 'empty string value',
          ctx:  { tag: 'test', value: '' },
        },
      ])('does not throw for valid context with $desc', ({ ctx }) => {
        const { s, commit } = makeStore();

        expect(() => actions.add({ commit, state: s }, ctx as any)).not.toThrow();
      });
    });

    describe('update', () => {
      it('throws when element id is not found in state', () => {
        const { s, commit } = makeStore();

        expect(() => actions.update({ commit, state: s }, { id: 42, context: { tag: 't', value: 'v' } } as any)).toThrow('[ui-context]');
      });

      it('commits update for existing element', () => {
        const { s, commit } = makeStore();

        s.elements[1] = { id: 1, context: { tag: 'test', value: 'original' } };
        const updated = { id: 1, context: { tag: 'test', value: 'updated' } };

        actions.update({ commit, state: s }, updated as any);

        expect(commit).toHaveBeenCalledWith('update', updated);
      });
    });

    describe('remove', () => {
      it('throws when element id is not found in state', () => {
        const { s, commit } = makeStore();

        expect(() => actions.remove({ commit, state: s }, 999 as any)).toThrow('[ui-context]');
      });

      it('commits remove with the found element', () => {
        const { s, commit } = makeStore();
        const element = { id: 1, context: { tag: 'test', value: 'val' } };

        s.elements[1] = element;
        actions.remove({ commit, state: s }, 1 as any);

        expect(commit).toHaveBeenCalledWith('remove', element);
      });
    });
  });
});
