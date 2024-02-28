import { invalidResource } from '@shell/utils/router';

export default {
  beforeCreate() {
    const { route, redirect } = this.$root.$options.context;
    const redirected = invalidResource(this.$store, route, redirect);

    if (redirected) {
      return redirected();
    }
  }
};
