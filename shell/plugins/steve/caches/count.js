// ToDo: do counts get classified in Vuex-land?
import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { hashObj } from '~/shell/utils/crypto/browserHashUtils';

export default class CountsCache extends SteveCache {
  hash() {
    // Given that we only receive delta's for counts now any new message over socket should represent an actual change
    return undefined;
  }

  load(payload = [], _, revision, { links, status, statusText }) {
    this.__requests[hashObj({})] = { // there's never any requests for this resource with filters so just request cache
      totalLength: 1,
      revision,
      links,
      status,
      statusText
    };
    this.resources = payload[0].counts; // the collection is actually just one big object in an array with one index location

    return this;
  }

  all() {
    const { links, status, statusText } = this.__requests[hashObj({})];

    return {
      status,
      statusText,
      data: {
        data: [
          {
            id:     'count',
            links,
            type:   'count',
            counts: this.resources
          }
        ],
      },
      actions:      {},
      links,
      resourceType: 'count',
      type:         'collection',
      listLength:   1,
      totalLength:  1
    };
  }
}
