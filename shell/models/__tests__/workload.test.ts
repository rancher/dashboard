import Workload from '@shell/models/workload.js';
import { steveClassJunkObject } from '@shell/plugins/steve/__tests__/utils/steve-mocks';
import { WORKLOAD_TYPES, SERVICE, INGRESS, GATEWAY_API } from '@shell/config/types';
import HttpRoute from '@shell/models/gateway.networking.k8s.io.httproute';
import Gateway from '@shell/models/gateway.networking.k8s.io.gateway';
import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';

describe('class: Workload', () => {
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
      workload.$store = { dispatch: dispatchMock };

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
      expect(card.props.title).toBe('component.resource.detail.card.podsCard.title');
      expect(card.props.showScaling).toBe(true);
      expect(card.props.noResourcesMessage).toBe('component.resource.detail.card.podsCard.noPods');
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
      expect(card.props.showScaling).toBe(false);
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
      expect(card.props.resources).toStrictEqual([]);
      expect(card.props.noResourcesMessage).toBe('component.resource.detail.card.podsCard.noPods');
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

      expect(card.props.showScaling).toBe(false);
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
      expect(card.props.title).toBe('component.resource.detail.card.jobsCard.title');
      expect(card.props.showScaling).toBe(false);
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
      const nonNullCards = cards.filter((c: any) => c !== null);

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
      expect(ingressesRow.to).toBe('#ingresses');
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
