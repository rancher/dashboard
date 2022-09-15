<script>
import day from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

export default {
  props: {
    gitSource:      { default: null, type: Object },
    commitPosition:     {
      default: null,
      type:    {
        text:     { default: null, type: String },
        position:  { default: null, type: Number },
      }
    },
    gitDeployment:  {
      default: null,
      type:    {
        deployedCommit: { default: null, type: String },
        commitsArray:    { default: null, type: Array },
      }
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
      <img :src="gitSource.owner.avatar_url" alt="">
      <div>
        <a ref="nofollow" target="_blank" :href="gitSource.owner.html_url">{{ gitSource.owner.login }}</a>
        <span>/</span>
        <a ref="nofollow" target="_blank" :href="gitSource.html_url">{{ gitSource.name }}</a>
      </div>
    </div>
    <div v-if="gitDeployment.deployedCommit" class="repo-info-revision">
      <span>
        <i class="icon icon-fw icon-commit"></i>
        {{ gitDeployment.deployedCommit.short }}

      </span>
      <span v-if="commitPosition" class="masthead-state badge-state">
        <i class="icon icon-fw icon-commit"></i>
        {{ commitPosition.text }}
      </span>
    </div>
    <div class="repo-info-description">
      <i class="icon icon-fw icon-comment"></i>
      <p>
        {{ gitSource.description }}
      </p>
    </div>
    <ul>
      <li>
        <span>Created</span>: {{ formatDate(gitSource.created_at) }}
      </li>
      <li>
        <span>Updated</span>: {{ formatDate(gitSource.updated_at, true) }}
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
    // outline: 1px solid var(--border);
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
        font-size: 12px;
        opacity: 0.5;
        span {
          color: #c4c4c4;
        }
      }
    }
  }

</style>
