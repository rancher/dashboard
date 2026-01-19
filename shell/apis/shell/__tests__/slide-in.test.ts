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
      width: '50%',
    };

    // 3. Act
    slideInApi.open(MockComponent, config);

    // 4. Assert
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
      component:      MockComponent,
      componentProps: { ...config }, // The implementation spreads the config
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
});
