import LogFlow from '@shell/models/logging.banzaicloud.io.flow';
import { steveClassJunkObject } from '@shell/plugins/steve/__tests__/utils/steve-mocks';
import { LOGGING } from '@shell/config/types';

describe('class: LogFlow', () => {
  describe('outputs method', () => {
    const outputName = 'output';
    const namespace = 'default';
    const otherNamespace = 'kube-system';

    const mockOutputDefault = {
      name:             outputName,
      metadata:         { namespace },
      providersDisplay: ['provider1']
    };

    const mockOutputOther = {
      name:             outputName,
      metadata:         { namespace: otherNamespace },
      providersDisplay: ['provider2']
    };

    const logFlowData = {
      ...steveClassJunkObject,
      type:     LOGGING.FLOW,
      metadata: { namespace },
      spec:     { localOutputRefs: [outputName] }
    };

    it('should return only outputs matching the current namespace', () => {
      const logFlow = new LogFlow(logFlowData, {
        getters:     {},
        dispatch:    jest.fn(),
        rootGetters: {
          'cluster/all': (type) => {
            if (type === LOGGING.OUTPUT) {
              return [mockOutputDefault, mockOutputOther];
            }

            return [];
          }
        }
      });

      expect(logFlow.outputs).toHaveLength(1);
      expect(logFlow.outputs[0]).toStrictEqual(mockOutputDefault);
    });
  });
});
