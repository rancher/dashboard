<script>
import Markdown from '@shell/components/Markdown';

export default {
  name: 'LicenseSlideIn',

  components: { Markdown },

  props: {
    licenseId: {
      type:    String,
      default: null
    },
    licenseField: {
      type:    String,
      default: null
    },
    home: {
      type:    String,
      default: null
    },
    author: {
      type:    String,
      default: null
    },
    // The license payload from licenses.json — either `{ markdown }` or
    // `{ text }`, or null when no license content was found.
    content: {
      type:    Object,
      default: null
    }
  },

  computed: {
    markdownText() {
      return this.content?.markdown || null;
    },

    plainText() {
      return this.content?.text || null;
    }
  }
};
</script>

<template>
  <div class="license-slide-in">
    <header class="meta-header">
      <span
        v-if="licenseId"
        class="license-badge"
      >{{ licenseId }}</span>
      <div
        v-if="licenseField && licenseField !== licenseId"
        class="raw-license"
      >
        {{ t('about.licenses.panel.rawLicense', { expression: licenseField }) }}
      </div>
      <a
        v-if="home"
        :href="home"
        target="_blank"
        rel="nofollow noopener noreferrer"
        class="home-link"
      >
        {{ home }}
      </a>
      <div
        v-if="author"
        class="author"
      >
        {{ t('about.licenses.panel.author', { author }) }}
      </div>
    </header>

    <Markdown
      v-if="markdownText"
      :value="markdownText"
      class="license-body"
    />
    <pre
      v-else-if="plainText"
      class="license-body license-body-text"
    >{{ plainText }}</pre>
    <div
      v-else
      class="empty"
    >
      {{ t('about.licenses.panel.none') }}
      <p
        v-if="licenseId"
        class="declared"
      >
        {{ t('about.licenses.panel.declaredAs', { license: licenseId }) }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.license-slide-in {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.meta-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.license-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-btn);
  color: var(--accent-btn-text);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.raw-license {
  color: var(--muted);
  font-size: 12px;
}

.home-link {
  font-size: 12px;
  word-break: break-all;
}

.author {
  color: var(--muted);
  font-size: 12px;
}

.license-body {
  flex: 1;
  overflow: auto;
  padding-right: 4px;

  // Generated notices use inline code for package and file names. The global
  // `code` style boxes it in a bordered, shaded chip, which reads as a UI
  // element in the middle of a paragraph — here we only want the typeface.
  :deep(code) {
    display: inline;
    padding: 0;
    border: none;
    border-radius: 0;
    background-color: transparent;
  }

  :deep(p) {
    margin: 0 0 14px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.license-body-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

.empty {
  color: var(--muted);
  text-align: center;
  padding: 32px 16px;
}

.declared {
  font-size: 12px;
  margin-top: 8px;
}
</style>
