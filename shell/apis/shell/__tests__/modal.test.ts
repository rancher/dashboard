// modal.test.ts

import {
  describe, it, expect, jest, beforeEach
} from '@jest/globals';
import { ModalApiImpl } from '../modal'; // Adjust path as needed
import { Store } from 'vuex';

// A mock component to use in tests
const MockComponent = { template: '<div>Mock</div>' };

describe('modalApiImpl', () => {
  let mockStore: Store<any>;
  let modalApi: ModalApiImpl;
  let mockCommit: jest.Mock;

  beforeEach(() => {
    // 1. Arrange: Create a mock commit function
    mockCommit = jest.fn() as any;

    // Create a mock store object
    mockStore = { commit: mockCommit } as any;

    // 2. Arrange: Instantiate the class with the mock store
    modalApi = new ModalApiImpl(mockStore);
  });

  it('should open a modal with all default values', () => {
    // 3. Act: Call the method with only the required component
    modalApi.open(MockComponent);

    // 4. Assert: Check if the store's commit was called correctly
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('modal/openModal', {
      component:           MockComponent,
      componentProps:      {},
      resources:           [],
      modalWidth:          '600px',
      closeOnClickOutside: true,
    });
  });

  it('should open a modal with custom configuration', () => {
    const config = {
      props:               { title: 'Hello' },
      resources:           [{ id: 1, type: 'node' }],
      width:               '800px',
      closeOnClickOutside: false,
    };

    // 3. Act: Call the method with a config
    modalApi.open(MockComponent, config);

    // 4. Assert: Check if the config values override the defaults
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledWith('modal/openModal', {
      component:           MockComponent,
      componentProps:      config.props,
      resources:           config.resources,
      modalWidth:          config.width,
      closeOnClickOutside: config.closeOnClickOutside,
    });
  });

  it('should correctly merge a partial config with defaults', () => {
    const config = { props: { id: '123' } };

    // 3. Act
    modalApi.open(MockComponent, config);

    // 4. Assert
    expect(mockCommit).toHaveBeenCalledWith('modal/openModal', {
      component:           MockComponent,
      componentProps:      config.props, // Custom
      resources:           [], // Default
      modalWidth:          '600px', // Default
      closeOnClickOutside: true, // Default
    });
  });
});
