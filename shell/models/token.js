import day from 'dayjs';
import NormanModel from '@shell/plugins/steve/norman-class';

export default class extends NormanModel {
  get _availableActions() {
    return super._availableActions.filter((a) => ['viewInApi', 'promptRemove'].includes(a.action));
  }

  get state() {
    return this.isExpired ? 'expired' : 'active';
  }

  get isExpired() {
    // Keep this updated, don't trust `expired`
    const expiry = day(this.expiresAt);

    return expiry.isBefore(day());
  }
}
