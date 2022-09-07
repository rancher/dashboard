import SteveModel from './steve-class';

/**
 * SteveModel that supports the description being in the root 'description' property.
 */
export default class SteveDescriptionModel extends SteveModel {
  // Preserve description
  constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
    const _description = data.description;

    super(data, ctx, rehydrateNamespace, setClone);
    this.description = _description;
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this._description = value;
  }

  // Ensure when we clone that we preserve the desription
  toJSON() {
    const data = super.toJSON();

    data.description = this.description;
    delete data._description;

    return data;
  }
}
