export default {

  _availableActions() {
    return this._standardActions.filter(x => ['promptRemove','viewInApi'].includes(x.action));
  },

  description() {
    return this._description;
  },

};
