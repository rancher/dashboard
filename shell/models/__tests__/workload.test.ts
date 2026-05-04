import Workload from '@shell/models/workload.js';
import { steveClassJunkObject } from '@shell/plugins/steve/__tests__/utils/steve-mocks';
import { WORKLOAD_TYPES, SERVICE, INGRESS } from '@shell/config/types';

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
    it('should return services that match workload pods', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'my-service', namespace: 'default' },
        spec:     { selector: { app: 'my-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      // Mock pods getter
      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

      const related = workload.relatedServices;

      expect(related).toContain(mockService);
    });

    it('should not return services from different namespace', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'my-service', namespace: 'other-namespace' },
        spec:     { selector: { app: 'my-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

      const related = workload.relatedServices;

      expect(related).toHaveLength(0);
    });

    it('should not return services with non-matching selectors', () => {
      const mockPod = {
        metadata: {
          name: 'pod-1', namespace: 'default', labels: { app: 'my-app' }
        }
      };
      const mockService = {
        metadata: { name: 'my-service', namespace: 'default' },
        spec:     { selector: { app: 'different-app' } }
      };
      const workload = new Workload({
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'test', namespace: 'default' },
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      jest.fn(),
          'cluster/all': (type: string) => (type === SERVICE ? [mockService] : [])
        },
      });

      Object.defineProperty(workload, 'pods', { get: () => [mockPod] });

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
          'i18n/t':      (key: string) => key,
          'cluster/all': () => []
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
          'i18n/t':      (key: string) => key,
          'cluster/all': () => []
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
        spec:     {}
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
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': (type: string) => {
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
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': (type: string) => {
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
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': (type: string) => {
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
        spec:     {}
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': (type: string) => {
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
});
