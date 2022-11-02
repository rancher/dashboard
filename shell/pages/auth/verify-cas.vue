<script>
import { BACK_TO } from '@shell/config/query-params';

function reply(err, code) {
  try {
    window.opener.window.onAuthTest(err, code);
    setTimeout(() => {
      window.close();
    }, 250);
  } catch (e) {
    window.close();
  }
}

export default {
  layout: 'unauthenticated',

  async fetch({ store, route, redirect }) {
    const ticket = route.query.ticket;
    const {
      error, error_description: errorDescription, errorCode, errorMsg
    } = route.query;

    if (error || errorDescription || errorCode || errorMsg) {
      let out = errorDescription || error || errorCode;

      if (errorMsg) {
        out = store.getters['i18n/withFallback'](`login.serverError.${ errorMsg }`, null, errorMsg);
      }

      redirect(`/auth/login?err=${ escape(out) }`);

      return;
    }

    if (ticket && window.opener) {
      return;
    }

    try {
      const res = await store.dispatch('auth/verifyCASAuth', { ticket });

      if ( res._status === 200) {
        const backTo = route.query[BACK_TO] || '/';

        redirect(backTo);
      } else {
        redirect(`/auth/login?err=${ escape(res) }`);
      }
    } catch (err) {
      redirect(`/auth/login?err=${ escape(err) }`);
    }
  },

  data() {
    const ticket = this.$route.query.ticket;

    return { testing: ticket && window.opener };
  },

  mounted() {
    if ( this.testing ) {
      try {
        const {
          error: respError, error_description: respErrorDescription, ticket, errorMsg
        } = this.$route.query;

        let error = respErrorDescription || respError || (!ticket ? 'No ticket supplied by auth provider' : null);

        if (errorMsg) {
          error = this.$store.getters['i18n/withFallback'](`login.serverError.${ errorMsg }`, null, errorMsg);
        }

        reply(error, ticket );
      } catch (e) {
        window.close();
      }
    } else if ( window.opener ) {
      if ( window.opener.window.onAuthTest ) {
        reply(null, null);
      } else {
        reply({ err: 'failure' });
      }
    }
  }
};
</script>

<template>
  <main>
    <h1 class="text-center mt-50">
      <span v-if="testing">
        Testing Configuration&hellip;
      </span>
      <span v-else>
        Logging In&hellip;
      </span>
    </h1>
  </main>
</template>
