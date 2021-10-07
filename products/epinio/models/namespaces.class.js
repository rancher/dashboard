// import axios from '@nuxtjs/axios';
import EpinioResource from './epinio-resource-instance.class';

export default class EpinioNamespaces extends EpinioResource {
  get id() {
    return `${ this.name }`;
  }

  get _availableActions() {
    return [
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    true,
        bulkAction: 'promptRemove',
        weight:     -10, // Delete always goes last
      },
      ...this._standardActions
    ];
  }

  get links() {
    const { epinioUrl } = process.env;
    const { name } = this;

    return {
      self:   `${ epinioUrl }/api/v1/namespaces/${ name }`,
      remove: `${ epinioUrl }/api/v1/namespaces/${ name }`,
      create: `${ epinioUrl }/api/v1/namespaces/`,
    };
  }

  async create() {
    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: { name: this.name }
    });
  }

  // async create() {
  //   const requestBody = JSON.stringify({ name: this.name });
  //   const { epinioUrl } = process.env;

  //   await axios.post(`${ epinioUrl }/api/v1/namespaces/`, requestBody)
  // }

  async remove(opt = {}) {
    opt.url = this.links.remove;

    opt.method = 'delete';

    const res = await this.$dispatch('request', { opt, type: this.type });

    console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console

    this.$dispatch('remove', this);
  }

  get canClone() {
    return false;
  }

  get canViewInApi() {
    return false;
  }

  get canCustomEdit() {
    return false;
  }
}
