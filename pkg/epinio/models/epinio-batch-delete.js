import Resource from '@shell/plugins/dashboard-store/resource-class';

export default class EpinioBatchDelete extends Resource {
  async remove(opt = {}) {
    console.log('🚀 ~ file: epinio-resource.js:45 ~ EpinioResource ~ remove ~ opt', opt);
    await this.bulkRemove();
    // if ( !opt.url ) {
    //   opt.url = (this.links || {})['self'];
    // }

    // opt.method = 'delete';

    // try {
    //   const res = await this.$dispatch('request', { opt, type: this.type });

    //   console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console
    //   this.$dispatch('remove', this);
    // } catch (e) {
    //   throw epinioExceptionToErrorsArray(e);
    // }
  }

  bulkRemove(opt = {}) {
    console.log('### Resource Bulk Remove', this.type, this.id, opt);// eslint-disable-line no-console
  }
}
