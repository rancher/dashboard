import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { nextTick } from 'vue';

describe('composables: useFetch', () => {
  it('should be in a loading state initially and call the fetch function immediately', () => {
    const mockFetch = jest.fn(() => new Promise(() => {})); // A promise that never resolves

    const result = useFetch(mockFetch);

    expect(result.value.loading).toBe(true);
    expect(result.value.data).toBeUndefined();
    expect(result.value.error).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should successfully fetch data and update state', async() => {
    const mockData = { id: 1, name: 'Test Data' };
    const mockFetch = jest.fn(() => Promise.resolve(mockData));

    const result = useFetch(mockFetch);

    // Initial state check
    expect(result.value.loading).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Wait for the promise to resolve and Vue to react
    await nextTick();

    // Final state check
    expect(result.value.loading).toBe(false);
    expect(result.value.data).toStrictEqual(mockData);
    expect(result.value.error).toBeUndefined();
  });

  it('should handle a fetch error and update state', async() => {
    const mockError = new Error('Network Failed');
    const mockFetch = jest.fn(() => Promise.reject(mockError));

    const result = useFetch(mockFetch);

    // Initial state check
    expect(result.value.loading).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Wait for the promise to reject and Vue to react
    await nextTick();

    // Final state check
    expect(result.value.loading).toBe(false);
    expect(result.value.data).toBeUndefined();
    expect(result.value.error).toStrictEqual(mockError);
  });

  it('should correctly handle a fetch function that returns a non-promise value', async() => {
    const mockData = 'just a string';
    // The composable uses `await`, which will wrap non-promise values.
    const mockFetch = jest.fn(() => mockData as any);

    const result = useFetch(mockFetch);

    expect(result.value.loading).toBe(true);

    await nextTick();

    expect(result.value.loading).toBe(false);
    expect(result.value.data).toBe(mockData);
    expect(result.value.error).toBeUndefined();
  });
});
