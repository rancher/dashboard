import day from 'dayjs';

export default {

  _availableActions() {
    return this._standardActions.filter(a => ['viewInApi', 'promptRemove'].includes(a.action));
  },

  state() {
    return this.isExpired ? 'expired' : 'active';
  },

  isExpired() {
    // Keep this updated, don't trust `expired`
    const expiry = day(this.expiresAt);

    return expiry.isBefore(day());
  }

};
