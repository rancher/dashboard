import { install, isNavigating } from '@shell/config/router/navigation-guards/navigation-state';

type Hook = (...args: unknown[]) => void;

/** A router whose hooks the test calls, as navigations start and settle */
function fakeRouter() {
  const hooks: Record<string, Hook> = {};
  const router = {
    beforeEach: (fn: Hook) => {
      hooks.before = fn;
    },
    afterEach: (fn: Hook) => {
      hooks.after = fn;
    },
    onError: (fn: Hook) => {
      hooks.error = fn;
    },
  };

  install(router);

  return {
    start:  (to: object) => hooks.before(to, {}, jest.fn()),
    settle: (to: object) => hooks.after(to, {}),
    fail:   () => hooks.error(new Error('guard failed')),
  };
}

describe('navigation state', () => {
  it('should say a navigation is under way from its first guard until it settles', () => {
    const router = fakeRouter();
    const to = { path: '/a' };

    expect(isNavigating()).toBe(false);
    router.start(to);
    expect(isNavigating()).toBe(true);
    router.settle(to);
    expect(isNavigating()).toBe(false);
  });

  it('should let a navigation go on once it is started', () => {
    const next = jest.fn();
    const hooks: Record<string, Hook> = {};

    install({
      beforeEach: (fn: Hook) => {
        hooks.before = fn;
      },
      afterEach: () => {},
      onError:   () => {}
    });
    hooks.before({}, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should keep a newer navigation under way when an older one settles, eg called off by it', () => {
    const router = fakeRouter();
    const older = { path: '/a' };
    const newer = { path: '/b' };

    router.start(older);
    router.start(newer);
    router.settle(older);
    expect(isNavigating()).toBe(true);

    router.settle(newer);
    expect(isNavigating()).toBe(false);
  });

  it('should say none is under way once one fails', () => {
    const router = fakeRouter();

    router.start({ path: '/a' });
    router.fail();

    expect(isNavigating()).toBe(false);
  });
});
