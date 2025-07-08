<script lang="ts">
import { defineComponent, h, VNode } from 'vue';
import { useStore } from 'vuex';
import { escapeHtml } from '@shell/utils/string';

const ALLOWED_TAGS = ['b', 'i', 'span', 'a']; // Add more as needed

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
 *     <router-link to="{ name: 'some-path }">{{ content }}</router-link>
 *   </template>
 * </RichTranslation>
 */
export default defineComponent({
  name:  'RichTranslation',
  props: {
    /**
     * The translation key for the message.
     */
    k: {
      type:     String,
      required: true,
    }
  },
  setup(props, { slots }) {
    const store = useStore();

    return () => {
    // Get the raw translation string, without any processing.
      const rawStr = store.getters['i18n/t'](props.k, {}, true);

      if (!rawStr || typeof rawStr !== 'string') {
        return h('span', {}, [rawStr]);
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
          children.push(h('span', { innerHTML: escapeHtml(rawStr.substring(lastIndex, match.index)) }));
        }

        const selfClosingTagName = match[3]; // Captures the tag name for self-closing tags (e.g., 'anotherTag' from <anotherTag/>)
        const enclosingTagName = match[1]; // Captures the tag name for enclosing tags (e.g., 'customLink' from <customLink>...</customLink>)

        if (enclosingTagName) {
        // This is an enclosing tag, like <tag>content</tag>.
          const tagName = enclosingTagName;
          const content = match[2];

          if (slots[tagName]) {
          // If a slot is provided for this tag, render the slot with the content.
            children.push(slots[tagName]({ content }));
          } else if (ALLOWED_TAGS.includes(tagName.toLowerCase())) {
          // If it's an allowed HTML tag, render it directly.
            children.push(h(tagName, { innerHTML: content }));
          } else {
          // Otherwise, render the tag and its content as plain HTML.
            children.push(h('span', { innerHTML: escapeHtml(match[0]) }));
          }
        } else if (selfClosingTagName) {
        // This is a self-closing tag, like <tag/>.
          const tagName = selfClosingTagName;

          if (slots[tagName]) {
          // If a slot is provided for this tag, render the slot.
            children.push(slots[tagName]({ content: '' }));
          } else if (ALLOWED_TAGS.includes(tagName.toLowerCase())) {
          // If it's an allowed HTML tag, render it directly.
            children.push(h(tagName));
          } else {
          // Otherwise, render the tag as plain HTML.
            children.push(h('span', { innerHTML: escapeHtml(match[0]) }));
          }
        }

        // Update the last index to continue searching after the current match
        lastIndex = regex.lastIndex;
      }

      // Add any remaining text after the last match.
      if (lastIndex < rawStr.length) {
        children.push(h('span', { innerHTML: escapeHtml(rawStr.substring(lastIndex)) }));
      }

      // Render the root element with the processed children.
      return h(props.tag as string, {}, children);
    };
  }
});
</script>
