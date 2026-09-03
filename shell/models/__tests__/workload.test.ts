import { flushPromises } from '@vue/test-utils';
import Workload, { scaleQueues } from '@shell/models/workload.js';
import { steveClassJunkObject } from '@shell/plugins/steve/__tests__/utils/steve-mocks';
import { WORKLOAD_TYPES, SERVICE, INGRESS, GATEWAY_API } from '@shell/config/types';
import HttpRoute from '@shell/models/gateway.networking.k8s.io.httproute';
import Gateway from '@shell/models/gateway.networking.k8s.io.gateway';
import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';

describe('class: Workload', () => {
  // Scale requests are queued in module scope, so an entry left behind by one test changes what
  // the next one counts from
  afterEach(() => {
    scaleQueues.forEach((queue: any) => clearTimeout(queue.forget));
    scaleQueues.clear();
  });

  describe('given custom workload keys', () => {
    const customContainerImage = 'image';
    const customContainer = {
      image:    customContainerImage,
      __active: 'whatever',
      active:   'whatever',
      _init:    'whatever',
      error:    'whatever',
    };
    const customWorkload = {
      ...steveClassJunkObject,
      type:        '123abv',
      __rehydrate: 'whatever',
      __clone:     'whatever',
      spec:        {
        template: {
          spec: {
            containers:     [customContainer],
            initContainers: [customContainer],
          }
        }
      }
    };

    (customWorkload.metadata as any).name = 'abc';

    it('should keep internal keys', () => {
      const workload = new Workload(customWorkload, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect({ ...workload }).toStrictEqual(customWorkload);
    });

    describe('method: save', () => {
      it('should remove all the internal keys', async() => {
        const dispatch = jest.fn();
        const workload = new Workload(customWorkload, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch,
          rootGetters: {
            'i18n/t':      jest.fn(),
            'i18n/exists': () => true,
          },
        });
        const expectation = {
          metadata: {
            name:                       'abc',
            fields:                     'whatever',
            resourceVersion:            'whatever',
            clusterName:                'whatever',
            deletionGracePeriodSeconds: 'whatever',
            generateName:               'whatever',
            ownerReferences:            'whatever',
          },
          spec: {
            template: {
              spec: {
                containers:     [{ image: customContainerImage }],
                initContainers: [{ image: customContainerImage }]
              }
            }
          }
        };

        await workload.save();

        const opt = {
          data:    expectation,
          headers: {
            accept:         'application/json',
            'content-type': 'application/json',
          },
          method: 'post',
          url:    undefined,
        };

        // Data sent should have been cleaned
        expect(dispatch).toHaveBeenCalledWith('request', { opt, type: customWorkload.type });

        // Original workload model should remain unchanged
        expect({ ...workload }).toStrictEqual(customWorkload);
      });
    });
  });

  describe('method: scale', () => {
    it('should call scaleUp when isUp is true', async() => {
      const scaleUpMock = jest.fn().mockResolvedValue(undefined);
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { replicas: 1 }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      workload.scaleUp = scaleUpMock;

      await workload.scale(true);

      expect(scaleUpMock).toHaveBeenCalledWith();
    });

    it('should call scaleDown when isUp is false', async() => {
      const scaleDownMock = jest.fn().mockResolvedValue(undefined);
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { replicas: 2 }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      workload.scaleDown = scaleDownMock;

      await workload.scale(false);

      expect(scaleDownMock).toHaveBeenCalledWith();
    });

    it('should dispatch growl error on failure', async() => {
      const dispatchMock = jest.fn();
      const scaleUpMock = jest.fn().mockRejectedValue(new Error('Scale failed'));
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test-workload', namespace: 'default' },
        spec:     { replicas: 1 }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    dispatchMock,
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      workload.scaleUp = scaleUpMock;

      await workload.scale(true);

      expect(dispatchMock).toHaveBeenCalledWith(
        'growl/fromError',
        expect.objectContaining({
          title: expect.stringContaining('workload.list.errorCannotScale'),
          err:   expect.any(Error)
        }),
        { root: true }
      );
    });
  });

  describe('methods: scaleUp and scaleDown', () => {
    const dispatch = jest.fn();

    // Requests are queued per resource, so each test needs its own workload rather than another
    // one wearing the same id
    let nextId = 0;

    const scalableWorkload = (replicas: number, patch: () => Promise<unknown>) => {
      const name = `test-${ ++nextId }`;
      const workload = new Workload({
        id:       `default/${ name }`,
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name, namespace: 'default' },
        spec:     { replicas }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch,
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      workload.patch = patch;

      return workload;
    };

    beforeEach(() => dispatch.mockClear());

    it('should merge patch the new replica count and nothing else', async() => {
      const patch = jest.fn().mockResolvedValue(undefined);
      const workload = scalableWorkload(2, patch);

      await workload.scaleUp();

      expect(workload.spec.replicas).toBe(3);
      // A save would send the whole workload as the browser last saw it, which both writes back
      // any other field that has changed since and carries a resourceVersion the cluster has
      // usually moved past
      expect(patch).toHaveBeenCalledWith({ spec: { replicas: 3 } }, {}, true);

      await workload.scaleDown();

      expect(workload.spec.replicas).toBe(2);
      expect(patch).toHaveBeenCalledWith({ spec: { replicas: 2 } }, {}, true);
    });

    it('should not write below zero replicas', async() => {
      const patch = jest.fn().mockResolvedValue(undefined);
      const workload = scalableWorkload(0, patch);

      await workload.scaleDown();

      expect(workload.spec.replicas).toBe(0);
      expect(patch).toHaveBeenCalledTimes(0);
    });

    it('should roll the replica count back when the write fails', async() => {
      const workload = scalableWorkload(2, jest.fn().mockRejectedValue(new Error('Forbidden')));

      // The optimistic write must not survive a rejected request. The store only re-fetches on a
      // 409, so nothing else puts the real count back.
      await expect(workload.scaleUp()).rejects.toThrow('Forbidden');

      expect(workload.spec.replicas).toBe(2);

      await expect(workload.scaleDown()).rejects.toThrow('Forbidden');

      expect(workload.spec.replicas).toBe(2);
    });

    it('should growl and leave the replica count unchanged when scale handles the failure', async() => {
      const workload = scalableWorkload(2, jest.fn().mockRejectedValue(new Error('Forbidden')));

      await workload.scale(true);

      expect(workload.spec.replicas).toBe(2);
      // Without the growl the count snaps back with nothing said, which reads as the button
      // having done nothing at all
      expect(dispatch).toHaveBeenCalledWith(
        'growl/fromError',
        expect.objectContaining({
          title: expect.stringContaining('workload.list.errorCannotScale'),
          err:   expect.any(Error)
        }),
        { root: true }
      );
    });
  });

  describe('scaling faster than the cluster answers', () => {
    const dispatch = jest.fn();

    // Requests are queued per resource, so each test needs its own workload rather than another
    // one wearing the same id
    let nextId = 0;

    const burstWorkload = (replicas: number, generation = 10) => {
      // The replica count in each request body, in order, and the resolver for each of those
      // requests. A request stays in flight until the test settles it.
      const writes: number[] = [];
      const settlers: Array<(err?: Error) => void> = [];
      const name = `burst-${ ++nextId }`;

      const workload = new Workload({
        id:       `default/${ name }`,
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name, namespace: 'default', generation
        },
        spec: { replicas }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch,
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      // A patch carries the count it was given and answers with the generation the write produced,
      // the way the cluster does. It does not touch the resource: what the cluster holds only
      // reaches the model when the change comes back round the websocket, which `echo` stands in
      // for.
      let nextGeneration = generation;

      workload.patch = jest.fn((data: any) => {
        writes.push(data.spec.replicas);

        const produced = ++nextGeneration;

        return new Promise((resolve, reject) => {
          settlers.push((err?: Error) => (err ? reject(err) : resolve({ metadata: { generation: produced } })));
        });
      });

      const settleNext = async(err?: Error) => {
        settlers.shift()?.(err);

        await flushPromises();
      };

      return {
        workload,
        writes,
        settleNext,
        // A websocket update landing on the resource: the count it now holds, and the generation
        // that produced it
        echo: (count: number, gen = nextGeneration) => {
          workload.spec.replicas = count;
          (workload.metadata as any).generation = gen;
        },
        inFlight:  () => settlers.length,
        settleAll: async(err?: Error) => {
          // A settled request can queue the next one, so keep going until nothing is in flight
          while (settlers.length) {
            await settleNext(err);
          }
        }
      };
    };

    beforeEach(() => {
      dispatch.mockClear();
    });

    it('should move the count on every click, before any request has answered', () => {
      const { workload, writes } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);
      workload.scale(true);

      // Nothing has settled, so every click after the first landed whilst a request was in flight
      expect(workload.spec.replicas).toBe(5);
      expect(writes).toStrictEqual([3]);
    });

    it('should coalesce a burst into one follow up request and land on the last click', async() => {
      const { workload, writes, settleAll } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);
      workload.scale(true);

      await settleAll();

      // Three clicks, two requests: the one already in flight and one carrying everything clicked
      // whilst it ran. Each carries an absolute target worked out at click time, so no two ask for
      // the same number, which is what loses a click to a read-modify-write race.
      expect(writes).toStrictEqual([3, 5]);
      expect(workload.spec.replicas).toBe(5);
    });

    it('should keep the clicked count when an update carrying the old one lands', async() => {
      const { workload, echo, settleNext } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);

      // The first request's change comes back round the websocket carrying 3, a count the user has
      // already moved past
      echo(3);

      await settleNext();

      expect(workload.spec.replicas).toBe(4);
    });

    it('should report the clicked count as desired whilst the requests settle', async() => {
      const { workload, echo, settleAll } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);

      // An update carrying the count from before the burst lands on the resource
      echo(2);

      // Every control that can change the count reads `desired`, and it has to stay on the number
      // the user asked for rather than flicking back to one the cluster has been told to leave
      expect(workload.desired).toBe(4);

      await settleAll();

      expect(workload.desired).toBe(4);
    });

    it('should hand the count back to the resource once it reports the generation the write produced', async() => {
      const { workload, echo, settleAll } = burstWorkload(2);

      workload.scale(true);
      await settleAll();

      // Accepted, but the change has not come back round the websocket yet, so the target is still
      // the only place the count the user asked for exists
      expect(workload.desired).toBe(3);
      expect(scaleQueues.size).toBe(1);

      echo(3);

      // The resource now carries the generation that write produced, so the queued target has
      // nothing left to say and the resource speaks for itself again
      expect(workload.desired).toBe(3);

      // ...including when what it carries is not what was asked for. Something else scaled it, and
      // that has to show rather than be hidden behind a target the cluster has moved past.
      echo(9);

      expect(workload.desired).toBe(9);
    });

    it('should count from the last click until the resource catches up', async() => {
      const {
        workload, writes, echo, settleAll
      } = burstWorkload(2);

      workload.scale(true);
      await settleAll();

      // The cluster has accepted 3, but the change has not come back round the websocket yet, so
      // an update carrying the count from before it can still arrive and put it back
      echo(2, 10);

      workload.scale(true);
      await settleAll();

      // Counting the second click from what is on the resource writes 3 twice and loses it
      expect(writes).toStrictEqual([3, 4]);
      expect(workload.spec.replicas).toBe(4);
    });

    it('should count from the last click, not from a count put back whilst a request is in flight', async() => {
      const {
        workload, writes, echo, settleAll
      } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);

      // A websocket update carrying the count the first request produced arrives whilst the second
      // click is still queued. Counting the next click from that is the read-modify-write race by
      // another route, and it is the one a real cluster actually takes.
      echo(3);

      workload.scale(true);

      expect(workload.spec.replicas).toBe(5);

      await settleAll();

      expect(writes).toStrictEqual([3, 5]);
      expect(workload.spec.replicas).toBe(5);
    });

    it('should coalesce clicks in both directions', async() => {
      const { workload, writes, settleAll } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);
      workload.scale(false);

      await settleAll();

      // The three clicks come back to the number the request already in flight is carrying, so
      // there is nothing left to send
      expect(writes).toStrictEqual([3]);
      expect(workload.spec.replicas).toBe(3);
    });

    it('should send one request per click when each has time to answer', async() => {
      const { workload, writes, settleAll } = burstWorkload(2);

      workload.scale(true);
      await settleAll();

      workload.scale(true);
      await settleAll();

      expect(writes).toStrictEqual([3, 4]);
      expect(workload.spec.replicas).toBe(4);
    });

    it('should not leave a target queued behind a failed request', async() => {
      const { workload, writes, settleAll } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);

      await settleAll(new Error('Forbidden'));

      // Nothing more is sent and the count goes back to one the cluster holds. Both clicks shared
      // the one refused request, so between them they report it once rather than twice.
      expect(writes).toStrictEqual([3]);
      expect(workload.spec.replicas).toBe(2);
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        'growl/fromError',
        expect.objectContaining({
          title: expect.stringContaining('workload.list.errorCannotScale'),
          err:   expect.any(Error)
        }),
        { root: true }
      );
    });

    it('should report every refused request when each click gets one of its own', async() => {
      const { workload, writes, settleAll } = burstWorkload(2);

      // Clicks the cluster answers faster than the user makes them, which is what a burst against
      // a responsive cluster looks like. Nothing coalesces, so nothing is folded into anything
      // else, and each refusal is its own piece of news.
      workload.scale(true);
      await settleAll(new Error('Forbidden'));

      workload.scale(true);
      await settleAll(new Error('Forbidden'));

      workload.scale(true);
      await settleAll(new Error('Forbidden'));

      expect(writes).toStrictEqual([3, 3, 3]);
      expect(workload.spec.replicas).toBe(2);
      expect(dispatch).toHaveBeenCalledTimes(3);
    });

    it('should fall back to the last count the cluster confirmed', async() => {
      const {
        workload, writes, settleNext, settleAll
      } = burstWorkload(2);

      workload.scale(true);
      workload.scale(true);
      workload.scale(true);

      // The first request is accepted, so 3 is confirmed. The follow up carrying 5 is refused.
      await settleNext();

      expect(writes).toStrictEqual([3, 5]);

      await settleAll(new Error('Forbidden'));

      expect(workload.spec.replicas).toBe(3);
    });

    it('should scale again after a failure', async() => {
      const { workload, writes, settleAll } = burstWorkload(2);

      workload.scale(true);
      await settleAll(new Error('Forbidden'));

      expect(workload.spec.replicas).toBe(2);

      workload.scale(true);
      await settleAll();

      expect(writes).toStrictEqual([3, 3]);
      expect(workload.spec.replicas).toBe(3);
    });

    it('should queue per resource rather than across them', () => {
      const first = burstWorkload(2);
      const second = burstWorkload(7);

      first.workload.scale(true);
      second.workload.scale(true);

      // A request in flight for one workload must not hold up, or coalesce with, another's
      expect(first.writes).toStrictEqual([3]);
      expect(second.writes).toStrictEqual([8]);
    });

    it('should give up on a request that never answers', async() => {
      jest.useFakeTimers();

      try {
        const { workload } = burstWorkload(2);

        const settled = workload.scaleUp();

        expect(workload.desired).toBe(3);

        // Nothing is ever settled. Without a bound the target would be reported for ever, for a
        // count the cluster may never have been told about, and the caller below would wait for
        // ever rather than the test finishing.
        jest.advanceTimersByTime(30000);

        await settled;

        expect(scaleQueues.size).toBe(0);
        expect(workload.desired).toBe(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it('should stop sending a burst once the workload has left the store', async() => {
      const { workload, writes, settleNext } = burstWorkload(2);
      let present = true;

      // `byId` is how the model asks whether the store still holds it, which is what deleting the
      // workload, or navigating away from its cluster, changes
      (workload as any).$ctx.getters['byId'] = () => (present ? workload : undefined);

      workload.scale(true);
      workload.scale(true);

      present = false;
      await settleNext();

      // The follow up carrying 4 is never sent: it would answer 404 and growl about scaling on
      // whatever page the user is now looking at
      expect(writes).toStrictEqual([3]);
      expect(scaleQueues.size).toBe(0);
      expect(dispatch).not.toHaveBeenCalledWith('growl/fromError', expect.anything(), expect.anything());
    });
  });

  describe('getter: relatedServices', () => {
    it('should return services that match workload pod template labels', () => {
      const mockService = {
        metadata: { name: 'my-service', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      const related = workload.relatedServices;

      expect(related).toContain(mockService);
    });

    it('should not return services from different namespace', () => {
      const mockService = {
        metadata: { name: 'my-service', namespace: 'other-namespace' },
        spec:     { selector: { app: 'my-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      const related = workload.relatedServices;

      expect(related).toHaveLength(0);
    });

    it('should not return services with non-matching selectors', () => {
      const mockService = {
        metadata: { name: 'my-service', namespace: 'default' },
        spec:     { selector: { app: 'different-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      const related = workload.relatedServices;

      expect(related).toHaveLength(0);
    });

    it('should return empty array when pod template has no labels', () => {
      const mockService = {
        metadata: { name: 'my-service', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: {} } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      const related = workload.relatedServices;

      expect(related).toHaveLength(0);
    });
  });

  describe('getter: podsCard', () => {
    const mockPod = { metadata: { name: 'pod-1', namespace: 'default' } };

    it('should return card for Deployment type', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });

      const card = workload.podsCard;

      expect(card).not.toBeNull();
      expect(card?.props.title).toBe('component.resource.detail.card.podsCard.title');
      expect(card?.props.showScaling).toBe(true);
      expect(card?.props.noResourcesMessage).toBe('component.resource.detail.card.podsCard.noPods');
    });

    it('should scale by spec.replicas rather than by the number of matching pods', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { replicas: 2 }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      // More pods match the label selector than the deployment has replicas
      Object.defineProperty(workload, 'pods', { get: () => [mockPod, mockPod, mockPod, mockPod] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });

      const card = workload.podsCard;

      expect(card?.props.scaleValue).toBe(2);
      expect(card?.props.resources).toHaveLength(4);
    });

    it('should scale from zero when spec.replicas is not set', async() => {
      const patch = jest.fn().mockResolvedValue(undefined);
      const workload = new Workload({
        id:       'default/unset-replicas',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });
      workload.patch = patch;

      const card = workload.podsCard;

      expect(card?.props.scaleValue).toBe(0);

      // The action has to agree with what the card shows: an unset `replicas` scales to 1, not to
      // NaN, which would be written as null
      await card?.props.onIncrease();

      expect(workload.spec.replicas).toBe(1);
      expect(patch).toHaveBeenCalledWith({ spec: { replicas: 1 } }, {}, true);
    });

    it('should return card for DaemonSet type without scaling', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DAEMON_SET,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });

      const card = workload.podsCard;

      expect(card).not.toBeNull();
      expect(card?.props.showScaling).toBe(false);
    });

    it('should return null for unsupported types like CronJob', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.CRON_JOB,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      const card = workload.podsCard;

      expect(card).toBeNull();
    });

    it('should return card when pods array is empty (scaled to 0)', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => [] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });

      const card = workload.podsCard;

      expect(card).not.toBeNull();
      expect(card?.props.resources).toStrictEqual([]);
      expect(card?.props.noResourcesMessage).toBe('component.resource.detail.card.podsCard.noPods');
    });

    it('should return null for non-scalable type with empty pods', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DAEMON_SET,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => [] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });

      const card = workload.podsCard;

      expect(card).toBeNull();
    });

    it('should return null when pods is undefined', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => undefined });

      const card = workload.podsCard;

      expect(card).toBeNull();
    });

    it('should hide scaling when canUpdate is false', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });
      Object.defineProperty(workload, 'canUpdate', { get: () => false });

      const card = workload.podsCard;

      expect(card?.props.showScaling).toBe(false);
    });
  });

  describe('getter: jobsCard', () => {
    const mockJob = { metadata: { name: 'job-1', namespace: 'default' } };

    it('should return card for CronJob type', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.CRON_JOB,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'jobs', { get: () => [mockJob] });

      const card = workload.jobsCard;

      expect(card).not.toBeNull();
      expect(card?.props.title).toBe('component.resource.detail.card.jobsCard.title');
      expect(card?.props.showScaling).toBe(false);
    });

    it('should return null for non-CronJob types', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      const card = workload.jobsCard;

      expect(card).toBeNull();
    });

    it('should return null when jobs array is empty', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.CRON_JOB,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': (key: string) => key },
      });

      Object.defineProperty(workload, 'jobs', { get: () => [] });

      const card = workload.jobsCard;

      expect(card).toBeNull();
    });
  });

  describe('getter: cards', () => {
    const mockPod = { metadata: { name: 'pod-1', namespace: 'default' } };
    const mockJob = { metadata: { name: 'job-1', namespace: 'default' } };

    it('should include podsCard for Deployment', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {},
        status:   {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': () => undefined,
          'cluster/all':       () => []
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });
      Object.defineProperty(workload, 'canUpdate', { get: () => true });

      const cards = workload.cards;

      // Cards should include podsCard (not null), jobsCard (null for deployment), and _cards from parent
      const nonNullCards = cards.filter((c): c is NonNullable<typeof c> => c !== null);

      expect(nonNullCards.length).toBeGreaterThanOrEqual(1);
      expect(nonNullCards[0].props.title).toBe('component.resource.detail.card.podsCard.title');
    });

    it('should include jobsCard for CronJob', () => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.CRON_JOB,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {},
        status:   {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': () => undefined,
          'cluster/all':       () => []
        },
      });

      Object.defineProperty(workload, 'jobs', { get: () => [mockJob] });

      const cards = workload.cards;
      const nonNullCards = cards.filter((c: any) => c !== null);

      // Should have jobsCard and insight card from parent
      const jobsCard = nonNullCards.find((c: any) => c.props.title === 'component.resource.detail.card.jobsCard.title');

      expect(jobsCard).toBeDefined();
    });
  });

  describe('getter: matchingIngresses', () => {
    const makeWorkload = (services: any[], ingresses: any[], pods: any[] = []) => {
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => {
            if (type === SERVICE) {
              return services;
            }
            if (type === INGRESS) {
              return ingresses;
            }

            return [];
          }
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => pods });

      return workload;
    };

    it('should return empty array when no related services', () => {
      const workload = makeWorkload([], [
        {
          metadata: { namespace: 'default' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] }
        }
      ]);

      expect(workload.matchingIngresses).toStrictEqual([]);
    });

    it('should find matching ingresses', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const mockIngress = {
        metadata: { namespace: 'default' },
        spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] }
      };

      const workload = makeWorkload([mockService], [mockIngress], [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(1);
      expect(workload.matchingIngresses[0]).toStrictEqual(mockIngress);
    });

    it('should not match ingresses from other namespaces', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const mockIngress = {
        metadata: { namespace: 'other' },
        spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] }
      };

      const workload = makeWorkload([mockService], [mockIngress], [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(0);
    });

    it('should not match ingresses pointing to other services', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const mockIngress = {
        metadata: { namespace: 'default' },
        spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc2' } } }] } }] }
      };

      const workload = makeWorkload([mockService], [mockIngress], [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(0);
    });

    it('should handle ingresses with no rules', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const mockIngress = {
        metadata: { namespace: 'default' },
        spec:     {}
      };

      const workload = makeWorkload([mockService], [mockIngress], [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(0);
    });

    it('should handle ingress rules with no paths', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const mockIngress = {
        metadata: { namespace: 'default' },
        spec:     { rules: [{ http: {} }] }
      };

      const workload = makeWorkload([mockService], [mockIngress], [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(0);
    });

    it('should handle ingress paths with no backend service', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const mockIngress = {
        metadata: { namespace: 'default' },
        spec:     { rules: [{ http: { paths: [{ backend: {} }] } }] }
      };

      const workload = makeWorkload([mockService], [mockIngress], [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(0);
    });

    it('should find one of many ingresses', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'svc1', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const ingresses = [
        {
          metadata: { namespace: 'other' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] }
        },
        {
          metadata: { namespace: 'default' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] }
        },
        {
          metadata: { namespace: 'default' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'svc2' } } }] } }] }
        }
      ];

      const workload = makeWorkload([mockService], ingresses, [mockPod]);

      expect(workload.matchingIngresses).toHaveLength(1);
      expect(workload.matchingIngresses[0]).toStrictEqual(ingresses[1]);
    });
  });

  describe('getter: resourcesCardRows', () => {
    it('should include services row when related services exist', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata:         { name: 'svc1', namespace: 'default' },
        spec:             { selector: { app: 'my-app' } },
        stateDisplay:     'Active',
        stateSimpleColor: 'success'
      };

      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': () => undefined,
          'cluster/all':       (type: string) => {
            if (type === SERVICE) {
              return [mockService];
            }

            return [];
          }
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

      const rows = workload.resourcesCardRows;
      const servicesRow = rows.find((r: any) => r.label === 'component.resource.detail.card.resourcesCard.rows.services');

      expect(servicesRow).toBeDefined();
    });

    it('should include ingresses row when matching ingresses exist', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata:         { name: 'svc1', namespace: 'default' },
        spec:             { selector: { app: 'my-app' } },
        stateDisplay:     'Active',
        stateSimpleColor: 'success'
      };
      const mockIngress = {
        metadata:         { namespace: 'default' },
        spec:             { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] },
        stateDisplay:     'Active',
        stateSimpleColor: 'success'
      };

      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': () => undefined,
          'cluster/all':       (type: string) => {
            if (type === SERVICE) {
              return [mockService];
            }
            if (type === INGRESS) {
              return [mockIngress];
            }

            return [];
          }
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

      const rows = workload.resourcesCardRows;
      const ingressesRow = rows.find((r: any) => r.label === 'component.resource.detail.card.resourcesCard.rows.ingresses');

      expect(ingressesRow).toBeDefined();
      expect(ingressesRow?.to).toBe('#ingresses');
    });

    it('should order services before ingresses', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata:         { name: 'svc1', namespace: 'default' },
        spec:             { selector: { app: 'my-app' } },
        stateDisplay:     'Active',
        stateSimpleColor: 'success'
      };
      const mockIngress = {
        metadata:         { namespace: 'default' },
        spec:             { rules: [{ http: { paths: [{ backend: { service: { name: 'svc1' } } }] } }] },
        stateDisplay:     'Active',
        stateSimpleColor: 'success'
      };

      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': () => undefined,
          'cluster/all':       (type: string) => {
            if (type === SERVICE) {
              return [mockService];
            }
            if (type === INGRESS) {
              return [mockIngress];
            }

            return [];
          }
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

      const rows = workload.resourcesCardRows;

      expect(rows[0].label).toBe('component.resource.detail.card.resourcesCard.rows.services');
      expect(rows[1].label).toBe('component.resource.detail.card.resourcesCard.rows.ingresses');
    });

    it('should not include ingresses row when no matching ingresses', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata:         { name: 'svc1', namespace: 'default' },
        spec:             { selector: { app: 'my-app' } },
        stateDisplay:     'Active',
        stateSimpleColor: 'success'
      };

      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': () => undefined,
          'cluster/all':       (type: string) => {
            if (type === SERVICE) {
              return [mockService];
            }

            return [];
          }
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

      const rows = workload.resourcesCardRows;
      const ingressesRow = rows.find((r: any) => r.label === 'component.resource.detail.card.resourcesCard.rows.ingresses');

      expect(ingressesRow).toBeUndefined();
    });
  });

  describe('getter: matchingHttpRoutes', () => {
    const mockService = {
      metadata: { name: 'svc1', namespace: 'default' },
      spec:     { selector: { app: 'my-app' } }
    };

    const makeHttpRoute = (spec: any, gateways: any[] = [], namespace = 'default') => new HttpRoute({
      metadata: { name: 'route1', namespace },
      spec
    }, {
      rootGetters: {
        'cluster/schemaFor': () => ({}),
        'cluster/all':       (type: string) => (type === GATEWAY_API.GATEWAY ? gateways : [])
      }
    });

    const makeWorkload = (services: any[], httpRoutes: any[], hasGatewayApi = true) => new Workload({
      type:     WORKLOAD_TYPES.DEPLOYMENT,
      metadata: { name: 'test', namespace: 'default' },
      spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
    }, {
      getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
      dispatch:    jest.fn(),
      rootGetters: {
        'i18n/t':            jest.fn(),
        'cluster/schemaFor': () => (hasGatewayApi ? {} : undefined),
        'cluster/all':       (type: string) => {
          if (type === SERVICE) {
            return services;
          }
          if (type === GATEWAY_API.HTTP_ROUTE) {
            return httpRoutes;
          }

          return [];
        }
      },
    });

    it('should return an empty array when there are no related services', () => {
      const route = makeHttpRoute({ rules: [{ backendRefs: [{ name: 'svc1' }] }] });

      expect(makeWorkload([], [route]).matchingHttpRoutes).toStrictEqual([]);
    });

    it('should return an empty array when no HTTPRoutes exist', () => {
      expect(makeWorkload([mockService], []).matchingHttpRoutes).toStrictEqual([]);
    });

    it('should not ask the store for a type with no schema, on a cluster without the Gateway API', () => {
      const clusterAll = jest.fn().mockReturnValue([]);
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     { template: { metadata: { labels: { app: 'my-app' } } } }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':            jest.fn(),
          'cluster/schemaFor': () => undefined,
          'cluster/all':       clusterAll,
        },
      });

      expect(workload.matchingHttpRoutes).toStrictEqual([]);
      expect(clusterAll).not.toHaveBeenCalledWith(GATEWAY_API.HTTP_ROUTE);
    });

    it('should find the routes that send traffic to a related service', () => {
      const route = makeHttpRoute({ rules: [{ backendRefs: [{ name: 'svc1' }] }] });
      const other = makeHttpRoute({ rules: [{ backendRefs: [{ name: 'svc2' }] }] });

      expect(makeWorkload([mockService], [other, route]).matchingHttpRoutes).toStrictEqual([route]);
    });

    it('should not match a route whose backendRef points at another namespace', () => {
      const route = makeHttpRoute({ rules: [{ backendRefs: [{ name: 'svc1', namespace: 'elsewhere' }] }] });

      expect(makeWorkload([mockService], [route]).matchingHttpRoutes).toStrictEqual([]);
    });
  });

  describe('getters: publicEndpoints / gatewayEndpoints / detailEndpoints', () => {
    const publicEndpoint = {
      addresses: ['172.18.0.3'], port: 80, protocol: 'HTTP', serviceName: 'default:svc1'
    };

    const mockService = {
      metadata: { name: 'svc1', namespace: 'default' },
      spec:     { selector: { app: 'my-app' } }
    };

    const mockGateway = new Gateway({
      metadata: { name: 'gw', namespace: 'default' },
      spec:     {
        listeners: [{
          name: 'http', protocol: 'HTTP', port: 80
        }]
      },
      status: {}
    });

    const mockRoute = new HttpRoute({
      metadata: { name: 'route1', namespace: 'default' },
      spec:     {
        parentRefs: [{ name: 'gw' }],
        hostnames:  ['demo.example.com'],
        rules:      [{ matches: [{ path: { value: '/shop' } }], backendRefs: [{ name: 'svc1' }] }]
      }
    }, {
      rootGetters: {
        'cluster/schemaFor': () => ({}),
        'cluster/all':       (type: string) => (type === GATEWAY_API.GATEWAY ? [mockGateway] : [])
      }
    });

    const makeWorkload = (annotations: any, httpRoutes: any[] = []) => new Workload({
      type:     WORKLOAD_TYPES.DEPLOYMENT,
      metadata: {
        name: 'test', namespace: 'default', annotations
      },
      spec: { template: { metadata: { labels: { app: 'my-app' } } } }
    }, {
      getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
      dispatch:    jest.fn(),
      rootGetters: {
        'i18n/t':            jest.fn(),
        'cluster/schemaFor': () => ({}),
        'cluster/all':       (type: string) => {
          if (type === SERVICE) {
            return [mockService];
          }
          if (type === GATEWAY_API.HTTP_ROUTE) {
            return httpRoutes;
          }

          return [];
        }
      },
    });

    it('should parse the publicEndpoints annotation', () => {
      const workload = makeWorkload({ [CATTLE_PUBLIC_ENDPOINTS]: JSON.stringify([publicEndpoint]) });

      expect(workload.publicEndpoints).toStrictEqual([publicEndpoint]);
    });

    it.each([
      ['no annotations at all', undefined],
      ['no publicEndpoints annotation', { other: 'value' }],
      ['a malformed annotation', { [CATTLE_PUBLIC_ENDPOINTS]: 'not json' }],
      ['an annotation that is not an array', { [CATTLE_PUBLIC_ENDPOINTS]: '{"a":1}' }],
    ])('should return no public endpoints for %s', (_label, annotations) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(makeWorkload(annotations).publicEndpoints).toStrictEqual([]);

      warn.mockRestore();
    });

    it('should resolve gateway endpoints through the matching routes', () => {
      expect(makeWorkload(undefined, [mockRoute]).gatewayEndpoints).toStrictEqual([
        { link: 'http://demo.example.com/shop', linkDisplay: 'http://demo.example.com/shop' }
      ]);
    });

    it('should combine published endpoints with gateway endpoints', () => {
      const workload = makeWorkload({ [CATTLE_PUBLIC_ENDPOINTS]: JSON.stringify([publicEndpoint]) }, [mockRoute]);

      expect(workload.detailEndpoints).toStrictEqual([
        publicEndpoint,
        { link: 'http://demo.example.com/shop', linkDisplay: 'http://demo.example.com/shop' }
      ]);
    });

    it('should be undefined when the workload is exposed by nothing, so the masthead row stays hidden', () => {
      // An empty array would be truthy and leave a labelled Endpoints row with no value.
      expect(makeWorkload(undefined).detailEndpoints).toBeUndefined();
    });
  });
});
