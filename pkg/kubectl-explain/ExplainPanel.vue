<script>
import { mapGetters } from 'vuex';
import Markdown from '@shell/components/Markdown';

export default {
  name: 'ExplainPanel',

  components: { Markdown },

  props: {
    definition: {
      type:     Object,
      required: true
    },
    expandAll: {
      type:     Boolean,
      required: true,
    }
  },

  data() {
    return {
      isOpen: false,
      expanded: {},
    };
  },

  mounted() {
    if (this.expandAll) {
      this.fields.forEach((field) => {
        if (field.$$ref) {
          this.$set(this.expanded, field.name, this.expandAll);
        }
      });
    }
  },

  watch: {
    expandAll(neu, old) {
      if (neu !== old) {
        this.fields.forEach((field) => {
          if (field.$$ref) {
            this.$set(this.expanded, field.name, neu);
          }
        });
      }
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),

    fields() {
      const defn = this.definition?.properties || {};
      const res = [];

      Object.keys(defn).forEach((k) => {
        res.push({
          name: k,
          ...defn[k]
        });
      });

      return res;
    }
   },

  methods: {
    expand(field) {
      this.$set(this.expanded, field, !this.expanded[field]);
    }
  }
};
</script>

<template>
  <div v-if="definition" class="main">
    <div class="title">
      Description
    </div>
    <div v-if="definition.description">{{ definition.description }}</div>
    <div v-else>No Description</div>
    <div
      v-if="fields.length"
      class="title"
    >
      Fields
    </div>
    <div v-for="field in fields" :key="field.name">
      <div class="field-section">
        <div class="field">
          {{ field.name }}
          <a
            v-if="field.$moreInfo"
            :href="field.$moreInfo"
            target="_blank"
            class="field-link"
          >
            <i class="icon icon-external-link" />
          </a>
        </div>
          <div v-if="field.type && field.type !== 'array'" class="field-type">
            <div>{{ field.type }}</div>
          </div>
          <div v-else class="field-type-panel">
            <span v-if="field.type === 'array'" class="mr-5">[]</span>
            <div v-if="field.$refName" class="field-type field-expander" @click="expand(field.name)">{{ field.$refNameShort }} <i class="icon icon-sort" /></div>
            <div v-else class="field-type">Object</div>
          </div>
        </div>
        <div class="ml-20">
          <!-- <div class="field-description">{{ field.description }}</div> -->
          <Markdown
            v-if="field.description"
            v-model="field.description"
          />
          <!-- <Description
            v-if="field.description"
            v-model="field.description"
          /> -->
        <div
          v-if="expanded[field.name]"
          class="sub-name ml-20"
        >
          {{ field.$refName }}
        </div>
        <ExplainPanel
          v-if="expanded[field.name]"
          :expand-all="expandAll"
          :definition="field.$$ref"
          class="embedded ml-20"
        />
      </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .main {
    // margin: 0 10px 10px 10px;
    overflow: scroll;
  }

  .embedded {
    // border-left: 2px solid var(--box-bg);
    border-bottom: 2px solid var(--primary);
    border: 2px solid var(--primary);
    padding-left: 10px;
    display: flex;
    flex-direction: column;
  }

  .sub-name {
    // background-color: var(--box-bg);
    background-color: var(--primary);
    color: var(--primary-text);
    padding: 4px;
    margin-top: 10px;
  }

  .title {
    text-transform: uppercase;
    margin: 10px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 4px 0;
  }

  .field-section {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 10px; 

    .field {
      margin-right: 20px;
    }
  }

  .field-description {
    line-height: 1.25;
    white-space: pre-wrap;
  }

  .field {
    margin: 5px 0;
    font-weight: bold;
    min-width: 100px; // Attempt type name alignment in general case
  }

  .field-type-panel {
    align-items: center;
    display: flex;
  }

  .field-type {
    border: 1px solid var(--border);
    padding: 1px 5px;
    border-radius: 5px;
    opacity: 0.85;
  }

  .field-link {
    margin-left: 10px;

    I {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }
  }

  .field-expander {
    align-items: center;
    display: flex;
    user-select: none;

    > i {
      font-size: 12px;
      padding-left: 4px;
    }

    &:hover {
      border-color: var(--link);
      background-color: var(--link);
      color: var(--link-text);
      cursor: pointer;
    }
  }
</style>
<style lang="scss" scoped>
  .markdown {
    ::v-deep {
      P {
        line-height: 1.25;
        margin-bottom: 10px;
      }

      LI:not(:last-child) {
        margin-bottom: 10px;
      }

      code {
        font-size: 12.5px;
        line-height: normal;
        padding: 0;
      }
    }
  }
</style>