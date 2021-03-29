<script>
import { mapPref, AFTER_LOGIN_ROUTE, SEEN_WHATS_NEW } from '@/store/prefs';
import RadioGroup from '@/components/form/RadioGroup';
import RadioButton from '@/components/form/RadioButton';
import SimpleBox from '@/components/SimpleBox';
import SortableTable from '@/components/SortableTable';
import Banner from '@/components/Banner';
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@/config/types';
import { NAME, STATE } from '@/config/table-headers';
import { createMemoryFormat, formatSi, parseSi } from '@/utils/units';

export default {
  name:            'WhatsNew',
  layout:          'default',
  components:      {
    RadioGroup,
    RadioButton,
    SimpleBox,
    SortableTable,
    Banner
  },

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });
  },

  data() {
    const sawWhatsNew = this.$store.getters['prefs/get'](SEEN_WHATS_NEW);

    // TODO don't set if dev build
    this.$store.dispatch('prefs/set', { key: SEEN_WHATS_NEW, value: true });

    return { clusters: [], sawWhatsNew };
  },

  computed:   {
    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),

    routeFromDropdown: {
      get() {
        if (this.afterLoginRoute !== 'whats-new' && this.afterLoginRoute !== 'last-visited') {
          const out = (this.routeDropdownOptions.filter(opt => opt.value === this.afterLoginRoute) || [])[0];

          return out;
        }

        return this.routeDropdownOptions[0];
      },
      set(neu) {
        this.afterLoginRoute = neu.value;
      }
    },

    routeRadioOptions() {
      return [
        {
          label: 'Take me back to this screen',
          value: 'whats-new'
        },
        {
          label: 'Take me to where I last was last login',
          value: 'last-visited'
        },
        {
          label: 'Make my home screen',
          value: 'dropdown'
        }
      ];
    },

    routeDropdownOptions() {
      const out = [
        {
          label: 'Apps and Marketplace',
          value: 'apps'
        }
      ];

      out.push( {
        label: `Overview for this Cluster (${ this.currentCluster.id }) `,
        value: `${ this.currentCluster.id }-dashboard`
      });

      if (this.currentCluster.id !== this.defaultClusterId) {
        out.push( {
          label: `Overview for the Default Cluster (${ this.defaultClusterId })`,
          value: `${ this.defaultClusterId }-dashboard`
        });
      }

      return out;
    },

    clusterHeaders() {
      return [
        STATE,
        NAME,
        {
          label: 'Provider',
          value: 'status.provider',
          name:  'Provider'
        },
        {
          label: 'Kubernetes Version',
          value: 'kubernetesVersion',
          name:  'Kubernetes Version'
        },
        {
          label: 'CPU',
          value: '',
          name:  'cpu',
          sort:  ['status.allocatable.cpu', 'status.available.cpu']

        },
        {
          label: 'Memory',
          value: '',
          name:  'memory',
          sort:  ['status.allocatable.memory', 'status.available.memory']

        },
        {
          name:  'pods',
          label: 'Pods',
          value: '',
          sort:  ['status.allocatable.pods', 'status.available.pods']
        }
      ];
    },

    ...mapGetters(['currentCluster', 'defaultClusterId'])
  },

  methods: {
    updateLoginRoute(neu) {
      if (neu) {
        this.afterLoginRoute = neu;
      } else {
        this.afterLoginRoute = this.routeFromDropdown?.value;
      }
    },

    cpuUsed(cluster) {
      return parseSi(cluster.status.requested?.cpu);
    },

    cpuAllocatable(cluster) {
      return parseSi(cluster.status.allocatable?.cpu);
    },

    memoryUsed(cluster) {
      const parsedUsed = (parseSi(cluster.status.requested?.memory) || 0).toString();

      const format = createMemoryFormat(parsedUsed);

      return formatSi(parsedUsed, format);
    },

    memoryAllocatable(cluster) {
      const parsedAllocatable = (parseSi(cluster.status.allocatable?.memory) || 0).toString();

      const format = createMemoryFormat(parsedAllocatable);

      return formatSi(parsedAllocatable, format);
    },
  }
};
</script>

<template>
  <form>
    <div v-if="!sawWhatsNew" class="row">
      <div class="col span-12">
        <Banner label="See what for we did lately" />
      </div>
    </div>
    <div class="row">
      <div class="col span-10">
        <div class="row mb-20">
          <div class="col span-6">
            <SimpleBox title="What do you want to see when you log in?">
              <RadioGroup id="login-route" :value="afterLoginRoute" name="login-route" :options="routeRadioOptions" @input="updateLoginRoute">
                <template #2="{option, listeners}">
                  <div class="row">
                    <div class="col">
                      <RadioButton :label="option.label" :val="false" :value="afterLoginRoute=== 'whats-new' || afterLoginRoute === 'last-visited'" v-on="listeners" />
                    </div>
                    <div class="col span-6">
                      <v-select v-model="routeFromDropdown" :clearable="false" :options="routeDropdownOptions" />
                    </div>
                  </div>
                </template>
              </RadioGroup>
            </SimpleBox>
          </div>
          <div class="col span-6">
            <SimpleBox id="migration" title="Migration Assistance">
              Read the migration guide for Cluster Manager users - everything you need to take advantage of the expanded Cluster Explorer.
              <br />
              <a class="pull-right" href="#">Learn More</a>
            </SimpleBox>
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <SortableTable key-field="id" :rows="clusters" :headers="clusterHeaders">
              <template #col:cpu="{row}">
                <td v-if="cpuAllocatable(row)">
                  {{ `${cpuUsed(row)}/${cpuAllocatable(row)} cores` }}
                </td>
                <td v-else>
                  &mdash;
                </td>
              </template>
              <template #col:memory="{row}">
                <td v-if="memoryAllocatable(row) && !memoryAllocatable(row).match(/^0 [a-zA-z]/)">
                  {{ `${memoryUsed(row)}/${memoryAllocatable(row)}` }}
                </td>
                <td v-else>
                  &mdash;
                </td>
              </template>
              <template #col:pods="{row}">
                <td v-if="row.status.allocatable.pods && row.status.allocatable.pods!== '0'">
                  {{ `${row.status.requested.pods}/${row.status.allocatable.pods}` }}
                </td>
                <td v-else>
                  &mdash;
                </td>
              </template>
            </SortableTable>
          </div>
        </div>
      </div>
      <div class="col span-2">
        <SimpleBox title="Community Support">
          <ul id="community-links" class="list-unstyled">
            <li>
              <i class="icon icon-external-link"></i>
              <a href="https://slack.rancher.io/" target="_blank" rel="noopener nofollow">Slack</a>
            </li>
            <li>
              <i class="icon icon-file"></i>
              <a href="https://rancher.com/docs/" target="_blank" rel="noopener nofollow">Docs</a>
            </li>
            <li>
              <i class="icon icon-external-link"></i>
              <a href="https://forums.rancher.com/" target="_blank" rel="noopener nofollow">Forums</a>
            </li>
            <li>
              <i class="icon icon-github"></i>
              <a href="https://github.com/rancher/rancher" target="_blank" rel="noopener nofollow">Github</a>
            </li>
          </ul>
        </SimpleBox>
        <SimpleBox title="Commercial Support">
        </SimpleBox>
      </div>
    </div>
  </form>
</template>

<style lang='scss'>
#login-route .radio-group{
    padding: 5px;
    &>DIV {
        margin: 5px;
    }
}

#migration {
  height: 100%;
  position: relative;
  & A {
    position: absolute;
    bottom: 15px;
    right: 15px
  }
}

#community-links {
  li {
    padding-top: 20px;
    i {
      color: var(--primary);
      padding: 10px;
    }
  }
}
</style>
