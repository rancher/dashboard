<script>
import day from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

export default {
  props: {
    gitSource:      { default: null, type: Object },
    commitPosition: {
      default: null,
      type:    Object
    },
    gitDeployment: {
      default: null,
      type:    Object
    },
  },
  methods: {
    formatDate(date, from) {
      day.extend(relativeTime);

      return from ? day(date).fromNow() : day(date).format('DD MMM YYYY');
    },
  },
};
</script>

<template>
  <div class="repo-info">
    <div class="repo-info-owner">
      <img
        :src="gitSource.owner.avatarUrl"
        alt=""
      >
      <div>
        <a
          ref="nofollow"
          target="_blank"
          :href="gitSource.owner.htmlUrl"
        >{{ gitSource.owner.name }}</a>
        <span>/</span>
        <a
          ref="nofollow"
          target="_blank"
          :href="gitSource.htmlUrl"
        >{{ gitSource.name }}</a>
      </div>
    </div>
    <div
      v-if="gitDeployment.deployedCommit"
      class="repo-info-revision"
    >
      <span>
        <i class="icon icon-fw icon-commit" />
        {{ gitDeployment.deployedCommit.short }}

      </span>
      <span
        v-if="commitPosition"
        class="masthead-state badge-state"
      >
        <i class="icon icon-fw icon-commit" />
        {{ commitPosition.text }}
      </span>
    </div>
    <div
      v-if="gitSource.description"
      class="repo-info-description"
    >
      <i class="icon icon-fw icon-comment" />
      <p>
        {{ gitSource.description }}
      </p>
    </div>
    <ul>
      <li>
        <span>{{ t('epinio.applications.detail.deployment.details.git.created') }}</span>: {{ formatDate(gitSource.created_at) }}
      </li>
      <li>
        <span>{{ t('epinio.applications.detail.deployment.details.git.updated') }}</span>: {{ formatDate(gitSource.updated_at, true) }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .application-card {
    margin-top: 0 !important;
  }

  .repo-info {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-gap: 20px;
    font-size: 14px;

    &-owner {
      display: flex;
      align-self: center;
      a {
        font-size: 16px !important;
      }

      img {
        margin-right: 8px;
        align-self: center;
        width: 20px;
        border-radius: 5%;
      }

      span {
        opacity: 0.5;
      }
    }

    &-description, &-revision{
      display: flex;
      align-items: center;
      align-self: center;
      i {
        opacity: 0.8;
      }

      span {
        display: flex;
        align-self: center;
      }
    }

    &-revision {
      justify-content: space-between;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      justify-content: space-between;

      li {
        font-size: 14px;
        opacity: 0.5;
        span {
          color: var(--default-text);
        }
      }
    }
  }

</style>
