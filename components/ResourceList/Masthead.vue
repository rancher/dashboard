<script>
import { mapGetters } from 'vuex';
import Banner from '@/components/Banner';
import Favorite from '@/components/nav/Favorite';
import ButtonDropdown from '@/components/ButtonDropdown';
import { HIDE_DESC, mapPref } from '@/store/prefs';
import { addObject } from '@/utils/array';

export default {
  components: {
    Banner,
    ButtonDropdown,
    Favorite,
  },
  props:      {
    resource: {
      type:     String,
      required: true
    },
    schema: {
      type:    Object,
      default: null
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
    ...mapGetters(['isExplorer']),

    hideDescriptions: mapPref(HIDE_DESC),

    resourceName() {
      if ( this.schema ) {
        return this.$store.getters['type-map/labelFor'](this.schema);
      }

      return this.resource;
    },

    typeDescriptionKey() {
      const key = `typeDescription."${ this.resource }"`;

      if ( this.hideDescriptions.includes(this.resource) || this.hideDescriptions.includes('ALL') ) {
        return false;
      }

      if ( this.$store.getters['i18n/exists'](key) ) {
        return key;
      }

      return false;
    },
  },

  methods: {
    hideTypeDescription() {
      const neu = this.hideDescriptions.slice();

      addObject(neu, this.resource);

      this.hideDescriptions = neu;
    },
  }
};
</script>

<template>
  <header>
    <h1>
      {{ typeDisplay }} <Favorite v-if="isExplorer" :resource="resource" />
    </h1>
    <div class="actions">
      <ButtonDropdown
        v-if="isCreatable || isYamlCreatable"
      >
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
    <Banner
      v-if="typeDescriptionKey"
      class="state-banner mt-20 mb-0"
      color="info"
      :closable="true"
      :label-key="typeDescriptionKey"
      @close="hideTypeDescription"
    />
  </header>
</template>
