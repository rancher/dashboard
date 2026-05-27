/**
 * Internal implementation of ResourceInstanceApi.
 *
 * Wraps a store model instance and exposes a curated set of methods.
 * The public interface (ResourceInstanceApi) controls what's visible
 * to extension developers via IntelliSense and documentation.
 *
 */
export class ResourceInstanceImpl implements ResourceInstanceApi {
  /**
   * The underlying store model instance (Resource/SteveModel).
   * Not exposed on the ResourceInstanceApi interface.
   * Defined as non-enumerable in the constructor so that structuredClone and
   * Vue's reactive proxy skip it (it contains functions and store references).
   */
  declare _model: any;

  private surfaceError(message: string, e?: any): never {
    console.error(`ResourceInstance API error - ${ this._model?.type }/${ this._model?.id } - ${ message }`); // eslint-disable-line no-console
    throw new Error(`ResourceInstance API error - ${ this._model?.type }/${ this._model?.id } - ${ message }`, { cause: e });
  }

  constructor(model: any) {
    // Store the model as non-enumerable so that structuredClone (used by Vue 3 HMR)
    // and JSON.stringify skip it — the model contains functions, store dispatch refs,
    // and circular references that cannot be cloned or serialized.
    Object.defineProperty(this, '_model', {
      value:        model,
      enumerable:   false,
      writable:     true,
      configurable: true,
    });

    // Proxy each data property (metadata, spec, status, etc.) from the model onto this
    // instance via getter/setter pairs. This lets consumers access resource data directly
    // (e.g. pod.metadata.name) while keeping the model as the single source of truth.
    // Internal/private keys (prefixed with _) and functions are excluded — only plain
    // data properties are surfaced.
    const descriptors = Object.getOwnPropertyDescriptors(model);

    for (const key of Object.keys(descriptors)) {
      if (key.startsWith('_') || key === 'constructor') {
        continue;
      }

      if (typeof model[key] !== 'function') {
        Object.defineProperty(this, key, {
          get: () => this._model[key],
          set: (val) => {
            this._model[key] = val;
          },
          enumerable:   true,
          configurable: true,
        });
      }
    }
  }

  // =========================================================================
  // Public methods — these satisfy ResourceInstanceApi
  // =========================================================================

  /**
   * Applies a partial update to this resource using HTTP PATCH (merge-patch).
   *
   * Only the fields provided in `data` are sent to the server — the rest of the resource
   * remains unchanged. The server response is merged back into this instance.
   *
   * Requires edit permissions (`canEdit`).
   *
   * @param data - An object containing only the fields to update.
   * @returns This resource instance, updated with the server response.
   */
  async patch(data: Record<string, any>) {
    if (!this._model.canEdit) {
      this.surfaceError('Cannot patch: permission denied');
    }

    const url = this._model.linkFor('update') || this._model.linkFor('self');
    const res = await this._model.$dispatch('request', {
      opt: {
        url,
        method:  'patch',
        headers: { 'content-type': 'application/merge-patch+json' },
        data,
      },
      type: this._model.type
    });

    if (res && res.kind !== 'Table') {
      await this._model.$dispatch('load', {
        data: res, existing: this._model, invalidatePageCache: false
      });
    }

    return this;
  }

  /**
   * Performs a full replacement update of this resource using HTTP PUT.
   *
   * Sends the entire current state of the resource to the server.
   *
   * Requires edit permissions (`canEdit`).
   *
   * @returns This resource instance, updated with the server response.
   */
  async update() {
    if (!this._model.canEdit) {
      this.surfaceError('Cannot update: permission denied');
    }

    await this._model.save();

    return this;
  }

  /**
   * Deletes this resource from the cluster.
   *
   * Requires delete permissions (`canDelete`).
   */
  async delete() {
    if (!this._model.canDelete) {
      this.surfaceError('Cannot delete: permission denied');
    }

    await this._model.remove();
  }

  // =========================================================================
  // Internal methods — available to shell code, NOT on the public interface
  // =========================================================================

  toJSON() {
    return typeof this._model.toJSON === 'function' ? this._model.toJSON() : { ...this._model };
  }
}
