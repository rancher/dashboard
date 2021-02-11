import { Popup, popupWindowOptions } from '@/utils/window';
import { parse as parseUrl, addParam } from '@/utils/url';
import { BACK_TO, SPA, _FLAGGED } from '@/config/query-params';

export function openAuthPopup(url, provider) {
  const popup = new Popup(() => {
    popup.promise = new Promise((resolve, reject) => {
      popup.resolve = resolve;
      popup.reject = reject;
    });

    window.onAuthTest = (error, code) => {
      if (error) {
        popup.reject(error);
      }

      delete window.onAuthTest;
      popup.resolve(code);
    };
  }, () => {
    popup.reject(new Error('Access was not authorized'));
  });

  popup.open(url, 'auth-test', popupWindowOptions());

  return popup.promise;
}

export function returnTo(opt, vm) {
  let { route = `/auth/verify` } = opt;

  if ( vm.$router.options && vm.$router.options.base ) {
    const routerBase = vm.$router.options.base;

    if ( routerBase !== '/' ) {
      route = `${ routerBase.replace(/\/+$/, '') }/${ route.replace(/^\/+/, '') }`;
    }
  }

  let returnToUrl = `${ window.location.origin }${ route }`;

  const parsed = parseUrl(window.location.href);

  if ( parsed.query.spa !== undefined ) {
    returnToUrl = addParam(returnToUrl, SPA, _FLAGGED);
  }

  if ( opt.backTo ) {
    returnToUrl = addParam(returnToUrl, BACK_TO, opt.backTo);
  }

  if (opt.config) {
    returnToUrl = addParam(returnToUrl, 'config', opt.config);
  }

  return returnToUrl;
}
