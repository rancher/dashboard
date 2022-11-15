<script>
import { mapPref, AFTER_LOGIN_ROUTE } from '@shell/store/prefs';
import { mapFeature, MULTI_CLUSTER } from '@shell/store/features';
import { RadioGroup, RadioButton } from '@components/Form/Radio';

import Select from '@shell/components/form/Select';
import { MANAGEMENT } from '@shell/config/types';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters } from '@shell/utils/cluster';

export default {
  components: {
    RadioGroup,
    RadioButton,
    Select,
  },

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });
  },

  data() {
    // Store the route as it was on page load (before the user may have changed it)
    const customRoute = this.$store.getters['prefs/get'](AFTER_LOGIN_ROUTE);

    return { clusters: [], customRoute };
  },

  computed: {
    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    mcm:             mapFeature(MULTI_CLUSTER),

    routeFromDropdown: {
      get() {
        const route = this.customRoute || {};
        const out = this.routeDropdownOptions.find(opt => opt.value.name === route.name && opt.value.params?.cluster === route.params?.cluster);

        return out || this.routeDropdownOptions[0];
      },
      set(neu) {
        this.customRoute = neu;
        this.afterLoginRoute = neu;
      }
    },

    routeRadioOptions() {
      const options = [
        {
          label: this.t('landing.landingPrefs.options.homePage'),
          value: 'home'
        },
        {
          label: this.t('landing.landingPrefs.options.lastVisited'),
          value: 'last-visited'
        },
        {
          label: this.t('landing.landingPrefs.options.custom'),
          value: 'dropdown'
        }
      ];

      // Remove the last option if not multi-cluster
      if (!this.mcm) {
        options.pop();
      }

      return options;
    },

    routeDropdownOptions() {
      // Drop-down shows list of clusters that can ber set as login landing page
      const out = [];
      const kubeClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(this.clusters), this.$store);

      kubeClusters.forEach((c) => {
        if (c.isReady) {
          out.push({
            label: c.nameDisplay,
            value: {
              name:   'c-cluster',
              params: { cluster: c.id }
            }
          });
        }
      });

      out.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));

      return out;
    }
  },

  methods: {
    updateLoginRoute(neu) {
      if (neu) {
        this.afterLoginRoute = neu;
      } else {
        this.afterLoginRoute = this.routeFromDropdown?.value;
      }
    },
  }
};
</script>

<template>
  <div>
    <p class="set-landing-leadin">
      {{ t('landing.landingPrefs.body') }}
    </p>
    <RadioGroup
      id="login-route"
      :value="afterLoginRoute"
      name="login-route"
      :options="routeRadioOptions"
      @input="updateLoginRoute"
    >
      <template #2="{option, listeners}">
        <div class="custom-page">
          <RadioButton
            :label="option.label"
            :val="false"
            :value="afterLoginRoute=== 'home' || afterLoginRoute === 'last-visited'"
            v-on="listeners"
          />
          <Select
            v-model="routeFromDropdown"
            :searchable="true"
            :disabled="afterLoginRoute === 'home' || afterLoginRoute === 'last-visited'"
            :clearable="false"
            :options="routeDropdownOptions"
            class="custom-page-options"
          />
        </div>
      </template>
    </RadioGroup>
  </div>
</template>

<style lang="scss" scoped>
  .custom-page {
    .custom-page-options {
      margin: 5px 0 0 20px;
      min-width: 320px;
      width: fit-content;
    }
  }
  .set-landing-leadin {
    padding-bottom: 10px;
  }
</style>
