import { REDIRECTED } from '@shell/config/cookies';

export default function({ store }) {
  // This tells Ember not to redirect back to us once you've already been to dashboard once.
  // TODO: Remove this once the ember portion of the app is no longer needed
  if ( !store.getters['cookies/get']({ key: REDIRECTED })) {
    const options = {
      path:     '/',
      sameSite: true,
      secure:   true,
    };

    store.commit('cookies/set', {
      key: REDIRECTED, value: 'true', options
    });
  }
}
