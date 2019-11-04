<script>

const VERSION = process.env.VERSION || 'dev';

export default {
  data() {
    return { version: VERSION };
  }
};

</script>

<template>
  <div class="footer">
    <div>{{ version }}</div>
    <div><a href="https://github.com/rancher/rio" target="_blank">Docs</a></div>
    <div><a href="https://forums.rancher.com/c/rio" target="_blank">Forums</a></div>
    <div><a href="https://slack.rancher.io" target="_blank">Slack</a></div>
    <div><a href="https://github.com/rancher/rio/issues/new" target="_blank">File an Issue</a></div>
    <div class="space" />
    <div><a href="https://github.com/rancher/rio#quick-start" target="_blank">Download CLI</a></div>
  </div>
</template>

<style lang="scss" scoped>
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border-top: solid thin var(--border);

    > DIV {
      line-height: 30px;
      padding: 10px 20px;

      &.space {
        flex-grow: 1;
      }
    }
  }
</style>
