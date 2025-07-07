<script lang="ts">
import { defineComponent, h, VNode } from 'vue';

/**
 * A component for rendering translated strings with embedded HTML and custom Vue components.
 *
 * This component allows you to use a single translation key for a message that contains
 * both standard HTML tags (like <b>, <i>, etc.) and custom Vue components (like <router-link>).
 *
 * @example
 * // In your translation file (e.g., en-us.yaml):
 * my:
 *   translation:
 *     key: 'This is a <b>bold</b> statement with a <customLink>link</customLink>.'
 *
 * // In your Vue component:
 * <RichTranslation k="my.translation.key">
 *   <template #customLink="{ content }">
 *     <router-link to="/some/path">{{ content }}</router-link>
 *   </template>
 * </RichTranslation>
 */
export default defineComponent({
  name: 'RichTranslation',
  props: {
    /**
     * The translation key for the message.
     */
    k: {
      type:     String,
      required: true,
    },
    /**
     * The HTML tag to use for the root element.
     */
    tag: {
      type:    [String, Object],
      default: 'span'
    },
  },
  render() {
    // Get the raw translation string, without any processing.
    const rawStr = this.$store.getters['i18n/t'](this.k, {}, true);

    if (!rawStr || typeof rawStr !== 'string') {
      return h(this.tag as string, {}, [rawStr]);
    }

    // This regex splits the string by the custom tags, keeping the tags in the resulting array.
    const regex = /<([a-zA-Z0-9]+)>(.*?)<\/\1>|<([a-zA-Z0-9]+)\/>/g;
    const children: (VNode | string)[] = [];
    let lastIndex = 0;
    let match;

    // Iterate over all matches of the regex.
    while ((match = regex.exec(rawStr)) !== null) {
      // Add the text before the current match as a plain text node.
      if (match.index > lastIndex) {
        children.push(h('span', { innerHTML: rawStr.substring(lastIndex, match.index) }));
      }

      const selfClosingTagName = match[3];
      const enclosingTagName = match[1];

      if (enclosingTagName) {
        // This is an enclosing tag, like <tag>content</tag>.
        const tagName = enclosingTagName;
        const content = match[2];

        if (this.$slots[tagName]) {
          // If a slot is provided for this tag, render the slot with the content.
          children.push(this.$slots[tagName]({ content }));
        } else {
          // Otherwise, render the tag and its content as plain HTML.
          children.push(h('span', { innerHTML: match[0] }));
        }
      } else if (selfClosingTagName) {
        // This is a self-closing tag, like <tag/>.
        const tagName = selfClosingTagName;

        if (this.$slots[tagName]) {
          // If a slot is provided for this tag, render the slot.
          children.push(this.$slots[tagName]({ content: '' }));
        } else {
          // Otherwise, render the tag as plain HTML.
          children.push(h('span', { innerHTML: match[0] }));
        }
      }
      
      lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match.
    if (lastIndex < rawStr.length) {
      children.push(h('span', { innerHTML: rawStr.substring(lastIndex) }));
    }

    // Render the root element with the processed children.
    return h(this.tag as string, {}, children);
  }
});
</script>
