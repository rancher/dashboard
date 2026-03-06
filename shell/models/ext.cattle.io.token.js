import SteveModel from '@shell/plugins/steve/steve-class';

export default class SteveToken extends SteveModel {
  // for now, we are only showing the new tokens in the UI. Later we will be able to edit a few of it's fields
  get _availableActions() {
    return super._availableActions.filter((a) => ['viewInApi', 'promptRemove'].includes(a.action));
  }

  cleanForSave(data) {
    const val = super.cleanForSave(data);

    delete val.type;

    return val;
  }

  get isDeprecated() {
    return undefined;
  }

  get state() {
    return this.isExpired ? 'expired' : !this.spec?.enabled ? 'inactive' : 'active';
  }

  get isExpired() {
    return this.status?.expired;
  }

  get expiresAt() {
    return this.status?.expiresAt || '';
  }

  get lastUsedAt() {
    return this.status?.lastUsedAt || '';
  }

  get description() {
    return this.spec?.description || '';
  }

  get clusterId() {
    return this.spec?.clusterName || '';
  }

  get created() {
    return this.metadata?.creationTimestamp;
  }
}
