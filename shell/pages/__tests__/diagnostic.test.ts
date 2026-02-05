import Diagnostic from '@shell/pages/diagnostic.vue';
import { shallowMount } from '@vue/test-utils';

describe('page: diagnostic should', () => {
  it('format memory sizes in human-readable format', () => {
    const mockPerformance = {
      memory: {
        jsHeapSizeLimit: 4294705152, // ~4GB in bytes
        totalJSHeapSize: 2147483648, // ~2GB in bytes
        usedJSHeapSize:  1073741824 // ~1GB in bytes
      },
      now: () => Date.now()
    };

    Object.defineProperty(window, 'performance', {
      value:        mockPerformance,
      writable:     true,
      configurable: true
    });

    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent:           'test-user-agent',
        language:            'en-US',
        cookieEnabled:       true,
        hardwareConcurrency: 8
      },
      writable:     true,
      configurable: true
    });

    const mockTranslation = (key, args) => {
      if (key === 'about.diagnostic.systemInformation.memJsHeapLimit') {
        return `Heap Size limit: ${ args.jsHeapSizeLimit }`;
      }
      if (key === 'about.diagnostic.systemInformation.memTotalJsHeapSize') {
        return `Total Heap Size: ${ args.totalJSHeapSize }`;
      }
      if (key === 'about.diagnostic.systemInformation.memUsedJsHeapSize') {
        return `Used Heap Size: ${ args.usedJSHeapSize }`;
      }

      return key;
    };

    const wrapper = shallowMount(Diagnostic, {
      global: {
        mocks: {
          $store: {
            dispatch: jest.fn(),
            getters:  {}
          },
          $t: mockTranslation,
          t:  mockTranslation
        },
        stubs: { AsyncButton: { template: '<div />' } }
      }
    });

    const systemInfo = (wrapper.vm as unknown as any).systemInformation;

    // Check that memory values are formatted (should contain units like GB, MB, etc.)
    expect(systemInfo.jsMemory.value).toContain('Heap Size limit:');
    expect(systemInfo.jsMemory.value).toContain('Total Heap Size:');
    expect(systemInfo.jsMemory.value).toContain('Used Heap Size:');

    // Verify that values are not raw bytes (should not be longer than 10 digits)
    // Formatted values should be like "4 GB", "2 GB", "1 GB" instead of raw byte counts
    expect(systemInfo.jsMemory.value).toContain('GB');
  });
});
