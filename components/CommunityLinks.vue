<script>
export default {
  props: {
    canClose: {
      type:    Boolean,
      default: false
    }
  }
};
</script>

<template>
  <div closeable class="box">
    <h2>{{ t('landing.community.title') }}</h2>
    <button v-if="canClose" type="button" class="role-link" @click="$emit('close', $event)">
      <i class="icon icon-x icon-lg text-primary" />
    </button>
    <ul id="community-links" class="list-unstyled">
      <li>
        <a href="https://slack.rancher.io/" target="_blank" rel="noopener nofollow"> <i class="icon icon-external-link"></i>Slack</a>
      </li>
      <li>
        <a href="https://rancher.com/docs/" target="_blank" rel="noopener nofollow"> <i class="icon icon-file"></i>Docs</a>
      </li>
      <li>
        <a href="https://forums.rancher.com/" target="_blank" rel="noopener nofollow"> <i class="icon icon-external-link"></i>Forums</a>
      </li>
      <li>
        <a href="https://github.com/rancher/rancher" target="_blank" rel="noopener nofollow"> <i class="icon icon-github"></i> Github</a>
      </li>
    </ul>
  </div>
</template>

<style lang='scss' scoped>
#community-links {
  li {
    padding: 0;
    a {
      padding-top: 20px;
      display: block;
    }
    i {
      padding-right: 20px;
    }
  }
}
</style>
