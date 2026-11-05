describe('workload mixin: container ids', () => {
  const ID_KEY = '_id';
  const mockStore = {
    getters: {
      'i18n/t':     (key: string) => key,
      currentStore: () => 'cluster',
    },
  };

  // The id counter lives at module level, so load a fresh copy to know which ids it generates
  function loadMixin(): any {
    let mixin: any;

    jest.isolateModules(() => {
      mixin = require('@shell/edit/workload/mixins/workload.js').default;
    });

    return mixin;
  }

  function buildCtx(mixin: any, containers: any[], initContainers: any[] = []) {
    const select = jest.fn();
    const ctx: any = {
      podTemplateSpec:          { containers, initContainers },
      idKey:                    ID_KEY,
      $store:                   mockStore,
      t:                        (key: string) => key,
      volumeClaimTemplateNames: [],
      volumeMountsOf:           mixin.methods.volumeMountsOf,
      $nextTick:                (fn: () => void) => fn(),
      $refs:                    { containersTabbed: { select } },
      containerChange:          0,
    };

    Object.defineProperty(ctx, 'allContainers', { get: () => mixin.computed.allContainers.call(ctx) });
    ctx.selectContainer = mixin.methods.selectContainer.bind(ctx);
    ctx.addContainer = mixin.methods.addContainer.bind(ctx);

    return { ctx, select };
  }

  describe('computed: allContainers', () => {
    it('gives each container without an id a unique id', () => {
      const mixin = loadMixin();
      const { ctx } = buildCtx(mixin, [{ name: 'a', image: 'nginx' }], [{ name: 'b', image: 'busybox' }]);

      const ids = ctx.allContainers.map((c: any) => c[ID_KEY]);

      expect(ids).toStrictEqual(['0', '1']);
    });

    it('keeps the id a container already has', () => {
      const mixin = loadMixin();
      const { ctx } = buildCtx(mixin, [{
        name: 'a', image: 'nginx', [ID_KEY]: 'existing'
      }]);

      expect(ctx.allContainers[0][ID_KEY]).toStrictEqual('existing');
    });

    it('does not reuse an id another container already has', () => {
      const mixin = loadMixin();
      const { ctx } = buildCtx(mixin, [
        {
          name: 'nginx', image: 'nginx', [ID_KEY]: '0'
        },
        { name: 'container-1', image: 'redis' },
      ]);

      const ids = ctx.allContainers.map((c: any) => c[ID_KEY]);

      expect(ids).toStrictEqual(['0', '1']);
    });

    it('does not reuse an id an init container already has', () => {
      const mixin = loadMixin();
      const { ctx } = buildCtx(
        mixin,
        [{ name: 'main', image: 'nginx' }],
        [{
          name: 'init', image: 'busybox', [ID_KEY]: '0'
        }],
      );

      const ids = ctx.allContainers.map((c: any) => c[ID_KEY]);

      expect(ids).toStrictEqual(['1', '0']);
    });
  });

  describe('method: addContainer', () => {
    const originalStructuredClone = window.structuredClone;

    beforeAll(() => {
      // jsdom does not provide structuredClone
      window.structuredClone = (arg: any) => JSON.parse(JSON.stringify(arg));
    });

    afterAll(() => {
      window.structuredClone = originalStructuredClone;
    });

    it('gives the new container an id different from the existing ones', () => {
      const mixin = loadMixin();
      const { ctx } = buildCtx(mixin, [{
        name: 'nginx', image: 'nginx', [ID_KEY]: '0'
      }]);

      ctx.addContainer();

      const ids = ctx.allContainers.map((c: any) => c[ID_KEY]);

      expect(ids).toStrictEqual(['0', '1']);
    });

    it('selects the new container tab by its id', () => {
      const mixin = loadMixin();
      const { ctx, select } = buildCtx(mixin, [{
        name: 'container-1', image: 'nginx', [ID_KEY]: '0'
      }]);

      ctx.addContainer();

      const added = ctx.podTemplateSpec.containers[1];

      expect(added.name).toStrictEqual('container-2');
      expect(select).toHaveBeenCalledWith(added[ID_KEY]);
    });

    it('makes the new container the active one', () => {
      const mixin = loadMixin();
      const { ctx } = buildCtx(mixin, [{
        name: 'nginx', image: 'nginx', [ID_KEY]: '0'
      }]);

      ctx.addContainer();

      expect(ctx.container).toBe(ctx.podTemplateSpec.containers[1]);
    });
  });
});
