<template>
  <div class="detail-top">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.detail-top {
    display: flex;
    & > * {
        padding: 10px 50px;
        display: flex;
        flex-direction: column;
        justify-content: center;

        &:not(:last-child) {
            border-right: 2px solid var(--border);
        }

        &:first-child {
            padding-left: 0;
        }

        & >:not(:first-child) {
            color: var(--input-label);
        }
    }
}
</style>
