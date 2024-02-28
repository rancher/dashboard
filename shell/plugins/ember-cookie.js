import { REDIRECTED } from '@shell/config/cookies';

export default function({ $cookies }) {
  // This tells Ember not to redirect back to us once you've already been to dashboard once.
  // TODO: Remove this once the ember portion of the app is no longer needed
  if ( !$cookies.get(REDIRECTED) ) {
    $cookies.set(REDIRECTED, 'true', {
      path:     '/',
      sameSite: true,
      secure:   true,
    });
  }
}
