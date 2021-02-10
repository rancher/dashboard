import { Popup, popupWindowOptions } from '@/utils/window';

export function getAuthCode(url, provider) {
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
