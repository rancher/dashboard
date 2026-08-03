import modalStore from '../modal';

describe('modal store', () => {
  let s: ReturnType<typeof modalStore.state>;
  const fakeComponent = { name: 'FakeComponent' } as any;

  beforeEach(() => {
    s = modalStore.state();
  });

  describe('state', () => {
    it('returns initial default state', () => {
      expect(s.isOpen).toBe(false);
      expect(s.component).toBeNull();
      expect(s.componentProps).toStrictEqual({});
      expect(s.resources).toStrictEqual([]);
      expect(s.closeOnClickOutside).toBe(false);
      expect(s.modalWidth).toStrictEqual('600px');
      expect(s.modalSticky).toBe(false);
    });
  });

  describe('mutations', () => {
    describe('openModal', () => {
      it('sets isOpen to true', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.isOpen).toBe(true);
      });

      it('stores the component reference', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.component).toBe(fakeComponent);
      });

      it('sets componentProps from payload', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent, componentProps: { foo: 'bar' } });

        expect(s.componentProps).toStrictEqual({ foo: 'bar' });
      });

      it('defaults componentProps to empty object when not provided', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.componentProps).toStrictEqual({});
      });

      it('preserves resources when payload resources is an array', () => {
        const res = [{ id: 1 }, { id: 2 }];

        modalStore.mutations.openModal(s, { component: fakeComponent, resources: res });

        expect(s.resources).toStrictEqual(res);
      });

      it('wraps a single non-array resource in an array', () => {
        const res = { id: 1 };

        modalStore.mutations.openModal(s, { component: fakeComponent, resources: res as any });

        expect(s.resources).toStrictEqual([res]);
      });

      it('sets resources to empty array when not provided', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.resources).toStrictEqual([]);
      });

      it('sets closeOnClickOutside to true when specified', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent, closeOnClickOutside: true });

        expect(s.closeOnClickOutside).toBe(true);
      });

      it('defaults closeOnClickOutside to false when not provided', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.closeOnClickOutside).toBe(false);
      });

      it('sets custom modalWidth from payload', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent, modalWidth: '800px' });

        expect(s.modalWidth).toStrictEqual('800px');
      });

      it('defaults modalWidth to 600px when not provided', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.modalWidth).toStrictEqual('600px');
      });

      it('sets modalSticky to true when specified', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent, modalSticky: true });

        expect(s.modalSticky).toBe(true);
      });

      it('defaults modalSticky to false when not provided', () => {
        modalStore.mutations.openModal(s, { component: fakeComponent });

        expect(s.modalSticky).toBe(false);
      });
    });

    describe('closeModal', () => {
      it('resets all state to defaults', () => {
        modalStore.mutations.openModal(s, {
          component:           fakeComponent,
          componentProps:      { foo: 'bar' },
          resources:           [{ id: 1 }],
          closeOnClickOutside: true,
          modalWidth:          '800px',
          modalSticky:         true,
        });

        modalStore.mutations.closeModal(s);

        expect(s.isOpen).toBe(false);
        expect(s.component).toBeNull();
        expect(s.componentProps).toStrictEqual({});
        expect(s.resources).toStrictEqual([]);
        expect(s.closeOnClickOutside).toBe(false);
        expect(s.modalWidth).toStrictEqual('600px');
        expect(s.modalSticky).toBe(false);
      });
    });
  });
});
