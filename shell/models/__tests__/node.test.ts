import Node from '@shell/models/cluster/node';

describe('class Node', () => {
  const resetMocks = () => {
    // Clear all mock function calls:
    jest.clearAllMocks();
  };

  it.each([
    ['1200', 1200],
    ['1k', 1000]
  ])('given %p status pod capacity value from the backend, should parse the value correctly as %p', (value, result) => {
    const node = new Node({ status: { capacity: { pods: value } } });

    expect(node.podCapacity).toStrictEqual(result);
    resetMocks();
  });
});
