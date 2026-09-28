<script>
import { MANAGEMENT, NORMAN } from '@shell/config/types';

export default {
  props: {
    value: {
      type:     String,
      required: true,
    },

    useMuted: {
      type:    Boolean,
      default: true,
    },

    showLabels: {
      type:    Boolean,
      default: false,
    }
  },

  async fetch() {
    this.loadData();
  },

  data() {
    // Load from cache immediately if possible
    return { principal: null };
  },

  computed: {
    showBoth() {
      const p = this.principal;

      return p.name && p.loginName && p.name.trim().toLowerCase() !== p.loginName.trim().toLowerCase();
    }
  },

  methods: {
    async loadData() {
      this.principal = this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value);

      if ( this.principal ) {
        return;
      }

      // Use encodeURIComponent (not the deprecated escape()) so non-ASCII characters
      // in the DN (e.g. Chinese) are emitted as valid UTF-8 percent-encoding rather
      // than non-standard %uXXXX sequences that ingress controllers reject with a 400.
      // encodeURIComponent encodes the whole principal id as a single path segment,
      // including forward slashes (-> %2F), so they aren't treated as path separators.
      const principalId = encodeURIComponent(this.value);

      try {
        this.principal = await this.$store.dispatch('rancher/find', {
          type: NORMAN.PRINCIPAL,
          id:   this.value,
          opt:  { url: `/v3/principals/${ principalId }` }
        });
      } catch (e) {
        // Fetching a principal directly requires permissions that a standard
        // (non-admin) user may not have, so the request above can fail. This is
        // expected for non-admins - log it (rather than swallowing it silently)
        // and fall through to the user-based fallback below to resolve the
        // display info.
        console.debug('Direct principal fetch failed, falling back to the user list', this.value, e); // eslint-disable-line no-console
      }

      // Fall back to the management user list, which a user with permission to
      // view users can still read even when they can't read principals.
      if ( !this.principal ) {
        this.principal = await this.loadPrincipalFromUser();
      }

      if ( !this.principal ) {
        console.error('Failed to fetch principal', this.value, principalId); // eslint-disable-line no-console
      }
    },

    /**
     * Fallback used when a principal can't be resolved directly (e.g. the
     * current user lacks permission to read principals). Resolves the matching
     * `management.cattle.io.user` - which the page is expected to have already
     * loaded (e.g. ExplorerMembers loads the users its members reference) - and
     * builds a principal from it so the member can still be displayed.
     */
    async loadPrincipalFromUser() {
      // Only look at users the store has actually loaded. Without this guard the
      // `all` getter would warn (and register the type) on every page that shows
      // a principal but never loads users.
      if ( !this.$store.getters['management/typeRegistered']?.(MANAGEMENT.USER) ) {
        return null;
      }

      const users = this.$store.getters['management/all']?.(MANAGEMENT.USER) || [];
      const user = users.find((u) => (u.principalIds || []).includes(this.value));

      if ( !user ) {
        return null;
      }

      // Build a norman principal from the user so the model getters (avatar,
      // displayType, ...) work exactly as they would for a fetched principal.
      //
      // Derive the provider from the id being rendered (this.value) rather than
      // user.provider: user.provider is aggregated across all of the user's
      // principalIds, so for a user with more than one it resolves to 'multiple'
      // (or the wrong driver) and mislabels the principal we're actually showing.
      const provider = this.value.split(':')[0].split('_')[0].toLowerCase();

      return this.$store.dispatch('rancher/create', {
        type:          NORMAN.PRINCIPAL,
        id:            this.value,
        principalType: 'user',
        provider,
        name:          user.displayName || user.nameDisplay,
        loginName:     user.username,
        me:            user.isCurrentUser,
      });
    }
  },

  watch: {
    value() {
      this.loadData();
    }
  },
};
</script>

<template>
  <div
    class="principal"
    :class="{'showLabels': showLabels}"
  >
    <template v-if="!principal && $fetchState.pending">
      <div class="avatar">
        <div class="empty">
          <i class="icon icon-spinner icon-lg" />
        </div>
      </div>
      <div
        v-clean-html="t('principal.loading', null, true)"
        class="name"
        :class="{'text-muted': useMuted}"
      />
      <div class="description" />
    </template>

    <template v-else-if="principal">
      <div class="avatar">
        <img
          :src="principal.avatarSrc"
          :class="{'round': principal.roundAvatar}"
          alt=""
        >
      </div>
      <div
        v-if="showLabels"
        class="name"
      >
        <table>
          <tbody>
            <tr><th>{{ t('principal.name') }}: </th><td>{{ principal.name || principal.loginName }}</td></tr>
            <tr><th>{{ t('principal.loginName') }}: </th><td>{{ principal.loginName }}</td></tr>
            <tr><th>{{ t('principal.type') }}: </th><td>{{ principal.displayType }}</td></tr>
          </tbody>
        </table>
      </div>
      <template v-else>
        <div class="name">
          <template v-if="showBoth">
            {{ principal.name }}
            <span
              v-if="principal.loginName"
              :class="{'text-muted': useMuted}"
            >({{ principal.loginName }})</span>
          </template>
          <template v-else-if="principal.name">
            {{ principal.name }}
          </template>
          <template v-else>
            {{ principal.loginName }}
          </template>
        </div>
        <div
          class="description"
          :class="{'text-muted': useMuted}"
        >
          {{ principal.displayType }}
        </div>
      </template>
    </template>

    <template v-else>
      <div class="avatar">
        <div
          class="empty"
          :class="{'text-muted': useMuted}"
        >
          <i class="icon icon-warning icon-lg" />
        </div>
      </div>
      <div
        v-t="'principal.error'"
        class="name text-error"
      />
      <div
        class="description"
        :class="{'text-muted': useMuted}"
      >
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
    grid-template-rows: auto math.div($size, 2);
    column-gap: 10px;

    th {
      text-align: left;
      font-weight: normal;
      padding-right: 10px;
    }

    &.showLabels {
      grid-template-areas:
        "avatar name";
      grid-template-columns: 60px auto;
      grid-template-rows: 60px;
      column-gap: 0;
      .name {
        line-height: unset;
      }

      table tr td:not(:first-of-type) {
        padding-left: 10px;
      }
    }

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
      line-height: math.div($size, 2);
      overflow-wrap: anywhere;
    }

    .description {
      grid-area: description;
      line-height: math.div($size, 2);
    }
  }
</style>
