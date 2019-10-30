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
    <div><a href="#">Docs</a></div>
    <div><a href="#">Forums</a></div>
    <div><a href="#">Slack</a></div>
    <div><a href="#">File an Issue</a></div>
    <div class="space" />
    <div><a href="#">Download CLI</a></div>
  </div>
</template>

<style lang="scss" scoped>
  .footer {
    background-color: var(--nav-bg);
    display: flex;
    justify-content: space-between;
    align-items: stretch;

    > DIV {
      line-height: 30px;
      padding: 10px 20px;

      &.space {
        flex-grow: 1;
      }
    }
  }
</style>
