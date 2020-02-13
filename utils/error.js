export class ClusterNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClusterNotFoundError';
  }
}
