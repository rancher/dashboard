<script lang="ts" setup>
import TabTitle from '@shell/components/TabTitle';
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1
          data-testid="charts-header-title"
          class="m-0"
        >
          <TabTitle :show-child="false">
            {{ t('user.retention.edit.title.header') }}
          </TabTitle>
          <router-link
            :to="{
              name: 'c-cluster-product-resource',
              params: {
                cluster: '_',
                product: 'auth',
                resource: 'management.cattle.io.user',
              }
            }"
          >
            {{ t('user.retention.edit.title.pre') }}
          </router-link>
          {{ t('user.retention.edit.title.post') }}
        </h1>
      </div>
    </header>
    <h2>{{ t('user.retention.edit.title.subTitle') }}</h2>
  </div>
</template>
