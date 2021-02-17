import { sortBy } from '@/utils/sort';
import { randomStr } from '@/utils/string';
import { parseSi } from '@/utils/units';
import { addParam, addParams } from '@/utils/url';
import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler';

const ENDPOINT = 'api.digitalocean.com/v2';

export const state = () => {
  return {};
};

export const actions = {
  async request({ dispatch }, {
    token, cloudCredentialId, command, opt, out
  }) {
    opt = opt || {};

    let url = '/meta/proxy/';

    if ( opt.url ) {
      url = opt.url.replace(/^https?\/\//, '');
    } else {
      url += `${ ENDPOINT }/${ command }`;
      url = addParam(url, 'per_page', opt.per_page || 100);
      url = addParams(url, opt.params || {});
    }

    const headers = { Accept: 'application/json' };

    if ( cloudCredentialId ) {
      headers['x-api-cattleauth-header'] = `Bearer credID=${ cloudCredentialId } passwordField=accessToken`;
    } else if ( token ) {
      headers['x-api-auth-header'] = `Bearer ${ token }`;
    }

    const res = await dispatch('management/request', {
      url,
      headers,
      redirectUnauthorized: false,
    }, { root: true });
    const body = res.body;

    if ( out ) {
      out[command].push(body[command]);
    } else {
      out = body;
    }

    // De-pagination
    if ( body?.links?.pages?.next ) {
      opt.url = body.links.pages.next;

      return dispatch('request', {
        token, cloudCredentialId, command, opt, out
      });
    }

    return out;
  }
};
