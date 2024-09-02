import { shallowMount } from '@vue/test-utils';
import HorizontalPodAutoScaler from '@shell/detail/autoscaling.horizontalpodautoscaler/index.vue';

describe('view: autoscaling.horizontalpodautoscaler', () => {
  const mockStore = {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      workspace:                 jest.fn(),
    },
  };

  const mocks = {
    $store:      mockStore,
    $fetchState: { pending: false },
    $route:      {
      query: { AS: '' },
      name:  {
        endsWith: () => {
          return false;
        },
      },
    },
  };

  const value = {
    status: {
      currentMetrics: [
        {
          resource: {
            current: {
              averageUtilization: 8,
              averageValue:       '11481088'
            },
            name: 'memory'
          },
          type: 'Resource'
        },
        {
          resource: {
            current: {
              averageUtilization: 0,
              averageValue:       '1m'
            },
            name: 'cpu'
          },
          type: 'Resource'
        }
      ],
    },
    spec: {
      maxReplicas: 10,
      metrics:     [
        {
          resource: {
            name:   'memory',
            target: {
              averageUtilization: 80,
              type:               'Utilization'
            }
          },
          type: 'Resource'
        },
        {
          resource: {
            name:   'cpu',
            target: {
              averageUtilization: 50,
              type:               'Utilization'
            }
          },
          type: 'Resource'
        }
      ],
      minReplicas:    1,
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind:       'Deployment',
        name:       'php-apache'
      }
    }
  };

  const metricsValue = Object.values(value.spec.metrics);
  const currentMetrics = Object.values(value.status.currentMetrics);

  const wrapper = shallowMount(HorizontalPodAutoScaler, {
    mocks,
    propsData: { value },
  });

  describe.each(value.spec.metrics)('should display metrics for each resource:', (metric) => {
    const name = metric.resource.name;

    it(`${ name }:`, () => {
      // Resource metrics
      const resourceValue = wrapper.find(`[data-testid="resource-metrics-value-${ name }"]`);
      const resourceName = wrapper.find(`[data-testid="resource-metrics-name-${ name }"]`);
      const metricValue = metricsValue.find((f) => f.resource.name === name)?.resource;

      // Current Metrics
      const averageUtilization = wrapper.find(`[data-testid="current-metrics-Average Utilization-${ name }"]`);
      const averageValue = wrapper.find(`[data-testid="current-metrics-Average Value-${ name }"]`);
      const currentResource = currentMetrics.find((f) => f.resource.name === name)?.resource.current;

      // Resource metrics
      expect(resourceValue.element.textContent).toBe(`${ metricValue?.target?.averageUtilization }`);
      expect(resourceName.element.textContent).toBe(`${ metricValue?.name }`);

      // Current Metrics
      expect(averageUtilization.element.textContent).toBe(`${ currentResource?.averageUtilization }`);
      expect(averageValue.element.textContent).toBe(`${ currentResource?.averageValue }`);
    });
  });
});
