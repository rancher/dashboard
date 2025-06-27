<script>
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import CopyToClipboardText from '@shell/components/CopyToClipboardText';

export default {
  name:       'ListOidcClients',
  components: {
    CopyToClipboardText,
    PaginatedResourceTable,
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const baseUrl = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL)?.value;

    return {
      issuerURL:         `${ baseUrl }/oidc`,
      discoveryDocument: `${ baseUrl }/oidc/.well-known/openid-configuration`,
      jwksURI:           `${ baseUrl }/oidc/.well-known/jwks.json`
    };
  },
};
</script>

<template>
  <div>
    <div class="oidc-application-list-header-data">
      <h3>{{ t('oidcclient.oidcEndpoints') }}</h3>
      <div>
        <label>{{ t('oidcclient.issuerURL') }}: </label>
        <CopyToClipboardText
          :aria-label="t('oidcclient.a11y.copyText.issuerURL')"
          :text="issuerURL"
          data-testid="oidc-clients-copy-clipboard-issuer-url"
        />
      </div>
      <div>
        <label>{{ t('oidcclient.discoveryDocument') }}: </label>
        <CopyToClipboardText
          :aria-label="t('oidcclient.a11y.copyText.discoveryDocument')"
          :text="discoveryDocument"
          data-testid="oidc-clients-copy-clipboard-discovery-document"
        />
      </div>
      <div>
        <label>{{ t('oidcclient.jwksUri') }}: </label>
        <CopyToClipboardText
          :aria-label="t('oidcclient.a11y.copyText.jwksUri')"
          :text="jwksURI"
          data-testid="oidc-clients-copy-clipboard-jwks-uri"
        />
      </div>
    </div>
    <PaginatedResourceTable
      :schema="schema"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      data-testid="oidc-clients-list"
    />
  </div>
</template>

<style lang="scss" scoped>
.oidc-application-list-header-data {
  align-items: center;
  padding: 10px 0px;
  display: flex;
  margin-bottom: 24px;
  flex-direction: column;
  align-items: start;

  > div:not(:last-child) {
    margin-bottom: 18px;
  }

  h3 {
    margin-bottom: 18px;
  }

  label {
    display: block;
  }

  a {
    font-weight: bold;
  }

  &>*:not(:last-child) {
    margin-right: 40px;
  }
}
</style>
