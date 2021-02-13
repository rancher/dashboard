import day from 'dayjs';

export default {

  _availableActions() {
    return this._standardActions.filter(x => ['promptRemove', 'viewInApi'].includes(x.action));
  },

  state() {
    const state = this.metadata?.state?.name || 'unknown';

    return this.isExpired ? 'expired' : state;
  },

  isExpired() {
    const expiry = day(this.expiresAt);

    return expiry.isBefore(day());
  }
};
