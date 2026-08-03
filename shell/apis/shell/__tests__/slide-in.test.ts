// slide-in.test.ts

import {
  describe, it, expect, jest, beforeEach
} from '@jest/globals';
import { SlideInApiImpl } from '../slide-in'; // Adjust path as needed
import { Store } from 'vuex';

// A mock component to use in tests
const MockComponent = { template: '<div>Mock</div>' };

describe('slideInApiImpl', () => {
  let mockStore: Store<any>;
  let slideInApi: SlideInApiImpl;
  let mockCommit: jest.Mock;

  beforeEach(() => {
    // 1. Arrange
    mockCommit = jest.fn() as any;
    mockStore = { commit: mockCommit } as any;

    // 2. Arrange
    slideInApi = new SlideInApiImpl(mockStore);
  });

  it('should open a slide-in panel with no config', () => {
    // 3. Act
    slideInApi.open(MockComponent);

    // 4. Assert
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: {},
    });
  });

  it('should open a slide-in panel with a config', () => {
    const config = {
      title: 'Test Panel',
      width: 'default' as const,
    };

    // 3. Act
    slideInApi.open(MockComponent, config);

    // 4. Assert
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: { title: 'Test Panel', width: 'default' },
    });
  });

  it('should open a slide-in panel with an undefined config gracefully', () => {
    // 3. Act
    slideInApi.open(MockComponent, undefined);

    // 4. Assert
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: {},
    });
  });

  it('should handle config with props property', () => {
    const config = {
      title: 'Test Panel',
      props: {
        foo: 'bar',
        baz: 123
      }
    };

    // 3. Act
    slideInApi.open(MockComponent, config);

    // 4. Assert
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: {
        title: 'Test Panel',
        foo:   'bar',
        baz:   123
      },
    });
  });

  it('should open with preset properties', () => {
    const config = {
      title:  'Preset Panel',
      width:  'wide' as const,
      height: 'full' as const,
    };

    slideInApi.open(MockComponent, config);

    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: {
        title:  'Preset Panel',
        width:  'wide',
        height: 'full',
      },
    });
  });

  it('should open with disableFocusTrap option', () => {
    const config = {
      width:            'wide' as const,
      height:           'full' as const,
      disableFocusTrap: true,
    };

    slideInApi.open(MockComponent, config);

    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: {
        width:            'wide',
        height:           'full',
        disableFocusTrap: true,
      },
    });
  });

  describe('deprecation warnings', () => {
    const originalEnv = process.env.dev;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      process.env.dev = 'true';
      warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      process.env.dev = originalEnv;
      warnSpy.mockRestore();
    });

    it('warns when deprecated "top" is used', () => {
      slideInApi.open(MockComponent, { top: '0' });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"top" is deprecated')
      );
    });

    it('warns when deprecated "showHeader" is used', () => {
      slideInApi.open(MockComponent, { showHeader: false });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"showHeader" is deprecated')
      );
    });

    it('does not warn when using preset properties', () => {
      slideInApi.open(MockComponent, {
        title:  'Test',
        width:  'wide' as const,
        height: 'full' as const,
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
