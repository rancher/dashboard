<script>
import BasicNavigation from '@shell/components/Navigation/ContextualNavigation/Basic';
import Item from '@shell/components/Navigation/ContextualNavigation/Item';
import { mapGetters } from 'vuex';
import { getVersionInfo } from '@shell/utils/version';

export default {
  components: { BasicNavigation, Item },
  computed:   {
    ...mapGetters(['clusterNavigation']),
    versionInfo() {
      return getVersionInfo(this.$store)?.displayVersion;
    }
  }
};
</script>

<template>
  <BasicNavigation>
    <div class="resources">
      <Item
        v-for="(group, i) in clusterNavigation"
        :key="i"
        :location="group.location"
        :label="group.label"
        :labelKey="group.labelKey"
        :children="group.children"
      />
    </div>
    <div class="footer">
      <div class="text-muted version flex">
        {{ versionInfo }}
      </div>
    </div>
  </BasicNavigation>
</template>

<style lang="scss" scoped>
    ::v-deep {
        nav {
            display: flex;
            flex-direction: column;
        }
    }
  .resources {
    display: flex;
    flex-direction: column;
    flex: 1;

    overflow-y: auto;
    overflow-x: hidden;
  }

  .footer {
    .version {
        margin: 0 10px 10px 10px;
    }
  }
</style>
