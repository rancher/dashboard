<script>
import ArrayList from '@/components/form/ArrayList';
import { _VIEW } from '@/config/query-params';
import InfoBox from '@/components/InfoBox';

export default {
  components: { ArrayList, InfoBox },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
    }
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(localValue) {
        this.$emit('input', localValue);
      }
    },
    defaultAddValue() {
      return {
        apiGroups:      [],
        kinds:     []
      };
    }
  }
};
</script>

<template>
  <div class="match-kinds">
    <ArrayList
      v-model="localValue"
      class="match-kinds-list"
      :protip="false"
      add-label="Add Kind"
      :mode="mode"
      :default-add-value="defaultAddValue"
    >
      <template v-slot:columns="scope">
        <InfoBox>
          <div class="row">
            <div class="api-groups">
              <ArrayList
                v-model="scope.row.value.apiGroups"
                class="api-groups-list"
                :protip="false"
                :show-header="true"
                value-label="ApiGroups"
                add-label="Add ApiGroup"
                value-placeholder=""
                :mode="mode"
              />
            </div>
            <div class="kinds">
              <ArrayList
                v-model="scope.row.value.kinds"
                class="kinds-list"
                :protip="false"
                :show-header="true"
                value-label="Kinds"
                add-label="Add Kind"
                value-placeholder=""
                :mode="mode"
              />
            </div>
          </div>
        </InfoBox>
      </template>
      <template v-slot:remove-button="scope">
        <button class="btn role-link close close-kind" @click="scope.remove">
          <i class="icon icon-2x icon-x" />
        </button>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss">
.match-kinds {

  .match-kinds-list > .box {
    position: relative;

    & > .remove {
      position: absolute;
      right: -10px;
      top: 0;

    }
  }

  .remove {
    width: initial;
  }

  .api-groups,
  .kinds {
    vertical-align: top;
    flex: 1;
  }
}
</style>
