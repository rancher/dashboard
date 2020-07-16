<script>
import Favorite from '@/components/nav/Favorite';

export default {
  components: { Favorite },
  props:      {
    resource: {
      type:     String,
      required: true
    },
    typeDisplay: {
      type:    String,
      default: ''
    },
    isCreatable: {
      type:    Boolean,
      default: false
    },
    isYamlCreatable: {
      type:    Boolean,
      default: false,
    },
    createLocation: {
      type:    Object,
      default: null
    },
    yamlCreateLocation: {
      type:    Object,
      default: null
    }
  },

  computed: {},
  methods:  {}
};
</script>

<template>
  <header>
    <h1>
      {{ typeDisplay }} <Favorite :resource="resource" />
    </h1>
    <div class="actions">
      <div class="dropdown-button btn bg-primary p-0">
        <nuxt-link
          v-if="isCreatable"
          :to="createLocation"
          class="btn bg-transparent create-button"
        >
          {{ t("resourceList.head.create") }}
        </nuxt-link>

        <v-popover
          placement="bottom"
          container=".actions"
          offset="10"
          :popper-options="{modifiers: { flip: { enabled: false } } }"
        >
          <button class="icon-container btn bg-transparent">
            <i class="icon icon-chevron-down" />
          </button>

          <template slot="popover">
            <ul class="list-unstyled menu" style="margin: -1px;">
              <nuxt-link
                v-if="isYamlCreatable"
                :to="yamlCreateLocation"
                tag="li"
                class="hand"
              >
                {{ t("resourceList.head.createFromYaml") }}
              </nuxt-link>
            </ul>
          </template>
        </v-popover>
      </div>
    </div>
  </header>
</template>

<style lang="scss">
  .actions {
    .v-popover {
      .text-right {
        margin-top: 5px;
      }
      .trigger {
        height: 100%;
        .icon-container {
          height: 100%;
          padding: 15px 10px 10px 10px;
        }
      }
    }
    .dropdown-button {
      background: var(--accent-btn);
      border: solid thin var(--link-text);
      color: var(--link-text);

      .create-button {
        border-right: 1px solid var(--link-text);
        margin-top: 10px;
        margin-bottom: 10px;
        padding: 5px 40px;

        &:focus {
          outline: none;
        }
      }
    }
    .popover {
      .popover-inner {
        color: var(--dropdown-text);
        background-color: var(--dropdown-bg);
        border: 1px solid var(--dropdown-border);
        padding: 0px;

        LI {
          padding: 10px 40px;

          &.divider {
            padding: 0;
            border-bottom: 1px solid var(--dropdown-divider);
          }

          &:not(.divider):hover {
            background-color: var(--dropdown-hover-bg);
            color: var(--dropdown-hover-text);
            cursor: pointer;
          }
        }
      }
    }
  }
</style>
