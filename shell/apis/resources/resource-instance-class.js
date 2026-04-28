/**
 * Internal implementation of ResourceInstanceApi.
 *
 * Wraps a store model instance and exposes a curated set of methods.
 * The public interface (ResourceInstanceApi) controls what's visible
 * to extension developers via IntelliSense and documentation.
 *
 * Methods not on the interface (like cleanForDiff, cleanForSave, etc.)
 * are available internally but hidden from the public API surface.
 */
export class ResourceInstanceImpl {
  /**
   * The underlying store model instance (Resource/SteveModel).
   * Not exposed on the ResourceInstanceApi interface.
   */
  _model;

  constructor(model) {
    this._model = model;

    // Proxy data properties from the model onto this instance
    // so that pod.metadata.name works directly
    const descriptors = Object.getOwnPropertyDescriptors(model);

    for (const key of Object.keys(descriptors)) {
      if (key.startsWith('_') || key === 'constructor') {
        continue;
      }

      if (typeof model[key] !== 'function') {
        Object.defineProperty(this, key, {
          get:          () => this._model[key],
          set:          (val) => { this._model[key] = val; },
          enumerable:   true,
          configurable: true,
        });
      }
    }
  }

  // =========================================================================
  // Public methods — these satisfy ResourceInstanceApi
  // =========================================================================

  async remove() {
    await this._model.remove();
  }

  bananas() {
    return this._model.cleanForDiff();
  }

  // =========================================================================
  // Internal methods — available to shell code, NOT on the public interface
  // =========================================================================

  cleanForSave(data) {
    return this._model.cleanForSave(data);
  }

  toJSON() {
    return this._model.toJSON();
  }
}
