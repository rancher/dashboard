export default {

  _availableActions() {
    return [
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    this.canDelete,
        bulkAction: 'promptRemove',
      },
      {
        action:  'viewInApi',
        label:   this.t('action.viewInApi'),
        icon:    'icon icon-external-link',
        enabled:  this.canViewInApi,
      }
    ];
  },

  description() {
    return this._description;
  },

  listLocation() {
    return '/account';
  },

  detailLocation() {
    return '/account';
  }

};
