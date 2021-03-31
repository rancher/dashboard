<script>
import SimpleBox from '@/components/SimpleBox';
export default { components: { SimpleBox } };
</script>

<template>
  <SimpleBox closeable class="mb-20" :title="t('landing.community.title')" @close="$emit('close', $event)">
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
  </SimpleBox>
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
