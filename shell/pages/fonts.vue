<script>
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import TabTitle from '@shell/components/TabTitle';

export default {
  components: { BackLink, TabTitle },
  mixins:     [BackRoute],
  data() {
    return {
      weights:    [300, 400, 500, 600, 700, 800, 900],
      sampleText: 'Książęcych spóźnień czułość. The quick brown fox jumps over the lazy dog. Zwei Boxkämpfer jagen Eva quer durch Sylt.',
    };
  },

  computed: {

    active() {
      const newFont = this.$store.getters['prefs/latoFontNew'];

      return newFont ? 'New Lato Font' : 'Old Lato Font';
    },
  }
};
</script>

<template>
  <div class="fonts">
    <BackLink :link="backLink" />
    <h1>
      <TabTitle breadcrumb="vendor-only">
        {{ t('fonts.title') }}
      </TabTitle>
    </h1>
    <p class="mb-20">
      {{ t('fonts.description') }}
    </p>
    <table>
      <thead>
        <tr>
          <th class="weight-col">
            {{ t('fonts.weight') }}
          </th>
          <th>Current ({{ active }})</th>
          <th>Old Lato Font</th>
          <th>New Lato Font</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="weight in weights"
          :key="weight"
        >
          <td class="weight-col">
            {{ weight }}
          </td>
          <td class="sample">
            <div
              class="size-large"
              :style="{ fontWeight: weight }"
            >
              {{ sampleText }}
            </div>
            <div
              class="size-small"
              :style="{ fontWeight: weight }"
            >
              {{ sampleText }}
            </div>
          </td>
          <td class="sample lato1">
            <div
              class="size-large"
              :style="{ fontWeight: weight }"
            >
              {{ sampleText }}
            </div>
            <div
              class="size-small"
              :style="{ fontWeight: weight }"
            >
              {{ sampleText }}
            </div>
          </td>
          <td class="sample lato2">
            <div
              class="size-large"
              :style="{ fontWeight: weight }"
            >
              {{ sampleText }}
            </div>
            <div
              class="size-small"
              :style="{ fontWeight: weight }"
            >
              {{ sampleText }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.fonts {
  table {
    width: 100%;
    border-collapse: collapse;
    border-radius: var(--border-radius);
    overflow: hidden;

    th, td {
      border: 1px solid var(--border);
      padding: 12px;
      text-align: left;
      vertical-align: top;
    }

    thead th {
      background-color: var(--sortable-table-top-divider);
    }

    .weight-col {
      width: 80px;
      text-align: center;
      font-weight: normal;
    }

    .sample {
      width: 33%;

      .size-large {
        font-size: 1.875rem;
        line-height: 1.2;
      }

      .size-small {
        font-size: 1.25rem;
        line-height: 1.3;
        margin-top: 8px;
      }
    }

    .sample.lato1 .size-large,
    .sample.lato1 .size-small {
      font-family: 'Lato1', sans-serif;
    }

    .sample.lato2 .size-large,
    .sample.lato2 .size-small {
      font-family: 'Lato2', sans-serif;
    }
  }
}
</style>
