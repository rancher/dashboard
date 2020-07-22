<script>
import capitalize from 'lodash/capitalize';
import Favorite from '@/components/nav/Favorite';
import ButtonDropdown from '@/components/ButtonDropdown';

export default {
  components: {
    ButtonDropdown,
    Favorite,
  },
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

  computed: {
    resourceName() {
      return this.resource.includes('.') ? this.resource : capitalize(this.resource);
    },
  },
};
</script>

<template>
  <header>
    <h1>
      {{ typeDisplay }} <Favorite :resource="resource" />
    </h1>
    <div class="actions">
      <ButtonDropdown>
        <template #button-content="slotProps">
          <nuxt-link
            v-if="isCreatable"
            :to="createLocation"
            class="btn bg-transparent"
            :class="slotProps.buttonSize"
          >
            {{ t("resourceList.head.create") }}
          </nuxt-link>
          <nuxt-link
            v-else-if="!isCreatable && isYamlCreatable"
            :to="yamlCreateLocation"
            class="btn bg-transparent"
            :class="slotProps.buttonSize"
          >
            {{ t("resourceList.head.createFromYaml") }}
          </nuxt-link>
          <a
            v-else
            href="#"
            class="btn bg-transparent"
            :class="slotProps.buttonSize"
            disabled="true"
            @click.prevent.self
          >
            {{ t("resourceList.head.create") }}
          </a>
        </template>
        <template
          v-if="isCreatable && isYamlCreatable"
          slot="popover-content"
        >
          <ul class="list-unstyled menu" style="margin: -1px;">
            <li class="hand">
              <nuxt-link
                v-if="isCreatable"
                :to="createLocation"
              >
                {{ t("resourceList.head.createResource", { resourceName }) }}
              </nuxt-link>
            </li>
            <li class="divider">
              <div class="divider-inner"></div>
            </li>
            <li class="hand">
              <nuxt-link
                v-if="isYamlCreatable"
                :to="yamlCreateLocation"
              >
                {{ t("resourceList.head.createFromYaml") }}
              </nuxt-link>
            </li>
          </ul>
        </template>
      </ButtonDropdown>
    </div>
  </header>
</template>
