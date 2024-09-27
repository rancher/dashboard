<script lang="ts">
import { defineComponent } from 'vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { SECRET } from '@shell/config/types';
import { NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, STATE } from '@shell/config/table-headers';
import Secret, { TYPES } from '@shell/models/secret';
import { Banner } from '@components/Banner';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { BadgeState } from '@components/BadgeState';

interface Data {
  schema: Object,
  headers: Object[],
  certs: Secret[],
  pagingParams: {
    pluralLabel: string,
    singularLabel: string
  }
}

export default defineComponent({
  components: {
    ResourceTable, Banner, BadgeState
  },

  async fetch() {
    // We're fetching secrets with a filter, this will clash with secrets in other contexts
    this.$store.dispatch('cluster/forgetType', SECRET);

    this.certs = await this.$store.dispatch('cluster/findAll', {
      type: SECRET,
      opt:  {
        watch:  false,
        // Note - urlOptions handles filter in a weird way
        filter: { 'metadata.fields.1': TYPES.TLS }
      }
    });
  },

  data(): Data {
    return {
      schema:  this.$store.getters['cluster/schemaFor'](SECRET),
      headers: [
        {
          ...STATE,
          formatter: null,
          name:      'certState',
          sort:      ['certState', 'nameSort'],
          value:     'certState',
        },
        NAME_COL,
        NAMESPACE_COL,
        {
          name:     'cn',
          labelKey: 'secret.certificate.cn',
          value:    (row: Secret) => {
            if (!row.cn) {
              return;
            }

            return row.cn + (row.unrepeatedSans.length ? ` ${ this.t('secret.certificate.plusMore', { n: row.unrepeatedSans.length }) }` : '');
          },
          sort:   ['cn'],
          search: ['cn'],
        }, {
          name:        'cert-expires2',
          labelKey:    'secret.certificate.expiresDuration',
          value:       (row: Secret) => row.timeTilExpirationDate,
          formatter:   'LiveDate',
          sort:        ['timeTilExpiration'],
          search:      ['timeTilExpiration'],
          defaultSort: true,
          width:       100
        }, {
          name:      'cert-expires',
          labelKey:  'secret.certificate.expiresOn',
          value:     'cachedCertInfo.notAfter',
          formatter: 'Date',
          sort:      ['cachedCertInfo.notAfter'],
          search:    ['cachedCertInfo.notAfter'],
        }, {
          name:     'cert-lifetime',
          labelKey: 'secret.certificate.lifetime',
          value:    (row: Secret) => row.certLifetime,
          sort:     ['certLifetime'],
          search:   ['certLifetime'],
        },
        AGE
      ],
      certs:        [],
      pagingParams: {
        pluralLabel:   this.t('secret.certificate.certificates'),
        singularLabel: this.t('secret.certificate.certificate')
      }
    };
  },

  computed: {
    expiredData(): any {
      let expiring = 0;
      let expired = 0;

      for (let i = 0; i < this.certs.length; i++) {
        const cert = this.certs[i];

        if (cert.certState === STATES_ENUM.EXPIRING) {
          expiring++;
        }
        if (cert.certState === STATES_ENUM.EXPIRED) {
          expired++;
        }
      }

      return {
        expiring: expiring ? this.t('secret.certificate.warnings.expiring', { count: expiring }) : '',
        expired:  expired ? this.t('secret.certificate.warnings.expired', { count: expired }) : '',
      };
    }
  },

  beforeUnmount() {
    // We're fetching secrets with a filter, clear it so as to not clash with other contexts
    this.$store.dispatch('cluster/forgetType', SECRET);
  },

});
</script>

<template>
  <div>
    <Banner
      v-if="expiredData.expiring"
      data-testid="cert-expiring-banner"
      color="warning"
      :label="expiredData.expiring"
    />
    <Banner
      v-if="expiredData.expired"
      color="error"
      :label="expiredData.expired"
    />
    <ResourceTable
      :loading="$fetchState.pending"
      :schema="schema"
      :headers="headers"
      :rows="certs"
      :paging-label="'secret.certificate.paging'"
      :paging-params="pagingParams"
      :ignore-filter="true"
    >
      <template #col:certState="{row}">
        <td>
          <BadgeState
            :color="row.certStateBackground"
            :label="row.certStateDisplay"
          />
        </td>
      </template>
    </ResourceTable>
  </div>
</template>
