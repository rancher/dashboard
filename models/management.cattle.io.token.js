import day from 'dayjs';

export default {

  _availableActions() {
    return this._standardActions.filter(x => ['promptRemove', 'viewInApi'].includes(x.action));
  },

  description() {
    return this._description;
  },

  state() {
    const state = this.metadata?.state?.name || 'unknown';
    const expiry = day(this.expiresAt);
    const expired = expiry.isBefore(day());

    return expired ? 'expired' : state;
  },
};
