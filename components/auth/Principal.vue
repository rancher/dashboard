<script>
import { NORMAN } from '@/config/types';

export default {
  props: {
    value: {
      type:     String,
      required: true,
    },

    useMuted: {
      type:    Boolean,
      default: true,
    }
  },

  async fetch() {
    if ( this.principal ) {
      return;
    }

    try {
      this.principal = await this.$store.dispatch('rancher/find', {
        type: NORMAN.PRINCIPAL,
        id:   this.value,
        opt:  { url: `/v3/principals/${ escape(this.value).replace(/\//g, '%2F') }` }
      });
    } catch (e) {
      // Meh...
    }
  },

  data() {
    // Load from cache immediately if possible
    return { principal: this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value) };
  },

  computed: {
    showBoth() {
      const p = this.principal;

      return p.name && p.loginName && p.name.trim().toLowerCase() !== p.loginName.trim().toLowerCase();
    }
  },
};
</script>

<template>
  <div class="principal">
    <template v-if="!principal && $fetchState.pending">
      <div class="avatar">
        <div class="empty">
          <i class="icon icon-spinner icon-lg" />
        </div>
      </div>
      <div class="name" :class="{'text-muted': useMuted}" v-html="t('principal.loading', null, true)" />
      <div class="description" />
    </template>

    <template v-else-if="principal">
      <div class="avatar">
        <img :src="principal.avatarSrc" :class="{'round': principal.roundAvatar}" />
      </div>
      <div class="name">
        <template v-if="showBoth">
          {{ principal.name }}
          <span v-if="principal.loginName" :class="{'text-muted': useMuted}">({{ principal.loginName }})</span>
        </template>
        <template v-else-if="principal.name">
          {{ principal.name }}
        </template>
        <template v-else>
          {{ principal.loginName }}
        </template>
      </div>
      <div class="description" :class="{'text-muted': useMuted}">
        {{ principal.displayType }}
      </div>
    </template>

    <template v-else>
      <div class="avatar">
        <div class="empty" :class="{'text-muted': useMuted}">
          <i class="icon icon-warning icon-lg" />
        </div>
      </div>
      <div v-t="'principal.error'" class="name text-error" />
      <div class="description" :class="{'text-muted': useMuted}">
        {{ value }}
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  $size: 40px;

  .principal {
    display: grid;
    grid-template-areas:
      "avatar name"
      "avatar description";
    grid-template-columns: $size auto;
    grid-template-rows: $size/2 $size/2;
    column-gap: 10px;

    .avatar {
      grid-area: avatar;
      text-align: center;

      DIV.empty {
        border: 1px solid var(--border);
        line-height: $size;
      }

      IMG {
        width: $size;
        height: $size;
      }

      DIV.round, IMG.round {
        border-radius: 50%;
      }
    }

    .name {
      grid-area: name;
      line-height: $size/2;
    }

    .description {
      grid-area: description;
      line-height: $size/2;
    }
  }
</style>
