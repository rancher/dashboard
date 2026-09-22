<script>
// Minimal AI chat client for the Home editor. Talks to the Rancher AI agent backend the same way
// the Liz chat does — a WebSocket proxied through the k8s API server — targeting the
// `home-editor-config` agent (shell/config/templating/home-editor-config.aiagentconfig.yaml),
// whose systemPrompt is the single source of truth for how to edit the Home page. Each message
// prepends only a tiny line naming the SAVED template ConfigMap to edit (see `preamble`). The Home
// page watches that ConfigMap and hot-reloads; the editor re-syncs from the saved source (parent).
// One socket per request, minimal frame parsing.

const AGENT_NAMESPACE = 'cattle-ai-agent-system';
const AGENT_NAME = 'rancher-ai-agent';
const WS_PATH = 'v1/ws/messages';

// Prepended to each message: a tiny per-request line naming the HomeTemplate CR to edit.
// The FULL contract (how to build the Home page — component library, imports, workflow, canonical
// example) now lives in the home-editor-config agent's systemPrompt
// (shell/config/templating/home-editor-config.aiagentconfig.yaml), the single source of truth.
// __CM_NAME__ is replaced with the ConfigMap the editor is currently editing.
const HOME_EDITOR_TARGET =
`For this request, edit ONLY the ConfigMap named "__CM_NAME__" in namespace "default" (it carries the label templates.rancher.io/ai-templating=true). Put the full Vue SFC into its data key "view.vue" (data['view.vue']). Do NOT change any other data key, the labels, or any other resource. Load the ConfigMap first, then write it back (update/patch).

`;

// Streaming frame markers (mirror rancher-ai-ui Tag enum).
const T = {
  msgStart:   '<message>',
  msgEnd:     '</message>',
  thinkStart: '<think>',
  thinkEnd:   '</think>',
  mcp:        '<mcp-response>',
  agentMeta:  '<agent-metadata>',
  chatErr:    '<chat-error>',
  err:        '<error>',
};

export default {
  name: 'HomeConfigChat',

  props: {
    // The agent to talk to — the home-editor-config AIAgentConfig, whose systemPrompt is the full
    // persona/contract. Must be applied + enabled in the cluster.
    agent: {
      type:    String,
      default: 'template-home-editor',
    },

    // Prepended to each outgoing message: a tiny per-request line naming the target ConfigMap. The
    // full instructions live in the agent's systemPrompt, so this stays minimal.
    preamble: {
      type:    String,
      default: HOME_EDITOR_TARGET,
    },

    // The SAVED template ConfigMap the editor is currently editing — the AI edits THIS one.
    configMapName: {
      type:    String,
      default: 'home',
    },

    // Human-facing name for the agent persona, shown in the chat UI (role label, placeholder, hint).
    // The Home editor uses "Home Editor"; the JSON template editor passes the JSON builder's name.
    personaLabel: {
      type:    String,
      default: 'Home Editor',
    },
  },

  emits: ['applied'],

  data() {
    return {
      messages:  [], // { role: 'user'|'assistant', content, tool?, completed? }
      input:     '',
      streaming: false,
      error:     '',
      ws:        null,
      assistant: null,
      inMessage: false,
      inThink:   false,
    };
  },

  beforeUnmount() {
    this.closeWs();
  },

  methods: {
    wsUrl() {
      return `wss://${ window.location.host }/api/v1/namespaces/${ AGENT_NAMESPACE }/services/http:${ AGENT_NAME }:80/proxy/${ WS_PATH }`;
    },

    send() {
      const text = this.input.trim();

      if (!text || this.streaming) {
        return;
      }

      this.error = '';
      this.messages.push({ role: 'user', content: text });
      this.input = '';

      // The assistant message we stream into.
      this.assistant = {
        role: 'assistant', content: '', tool: false, completed: false
      };
      this.messages.push(this.assistant);
      this.inMessage = false;
      this.inThink = false;
      this.streaming = true;

      this.$nextTick(this.scrollToBottom);

      // Show only what the user typed, but SEND the tiny target line (with the ConfigMap name
      // injected) + message. The agent's systemPrompt carries the full contract.
      const preamble = this.preamble.replace(/__CM_NAME__/g, this.configMapName || 'home');
      const payload = JSON.stringify({
        prompt:  `${ preamble }\n${ text }`,
        agent:   this.agent,
        context: {},
      });

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);

        return;
      }

      // (Re)open the socket, then send on open.
      this.closeWs();
      const ws = new WebSocket(this.wsUrl());

      this.ws = ws;
      ws.onopen = () => ws.send(payload);
      ws.onmessage = (ev) => this.onFrame(ev.data);
      ws.onerror = () => {
        this.error = 'Connection error talking to the AI agent.';
        this.finishStreaming();
      };
      ws.onclose = () => this.finishStreaming();
    },

    onFrame(data) {
      if (typeof data !== 'string' || !this.assistant) {
        return;
      }

      switch (data) {
      case T.msgStart:
        this.inMessage = true;

        return;
      case T.msgEnd:
        this.inMessage = false;
        this.assistant.completed = true;
        this.streaming = false;

        // A resource write ran this turn — tell the editor so it can pull the new source into view.
        if (this.assistant.tool) {
          this.$emit('applied');
        }

        return;
      case T.thinkStart:
        this.inThink = true;

        return;
      case T.thinkEnd:
        this.inThink = false;

        return;
      default:
        break;
      }

      // A tool ran (the agent wrote the ConfigMap) — flag it so the UI can show a hint.
      if (data.startsWith(T.mcp)) {
        this.assistant.tool = true;

        return;
      }
      if (data.startsWith(T.agentMeta)) {
        return;
      }
      if (data.startsWith(T.chatErr) || data.startsWith(T.err)) {
        this.error = data.replace(/<\/?[a-z-]+>/g, '').trim() || 'Agent error';

        return;
      }

      if (this.inMessage && !this.inThink) {
        this.assistant.content += data;
        this.$nextTick(this.scrollToBottom);
      }
    },

    finishStreaming() {
      this.streaming = false;
      if (this.assistant && !this.assistant.completed) {
        this.assistant.completed = true;
      }
    },

    closeWs() {
      if (this.ws) {
        try {
          this.ws.onclose = null;
          this.ws.close();
        } catch (e) {
          // ignore
        }
        this.ws = null;
      }
    },

    scrollToBottom() {
      const el = this.$refs.log;

      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },

    onKeydown(e) {
      // Enter sends, Shift+Enter newlines.
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    },
  },
};
</script>

<template>
  <div class="home-chat">
    <!-- Shows exactly which SAVED template the AI will edit (the selected one). -->
    <div class="home-chat__target text-muted">
      AI edits template: <code>{{ configMapName || 'home' }}</code>
    </div>
    <div
      ref="log"
      class="home-chat__log"
    >
      <div
        v-if="!messages.length"
        class="home-chat__empty text-muted"
      >
        Ask the {{ personaLabel }} to change what you’re editing — e.g. “add a welcome header and
        list my clusters as cards”. It edits <code>default/{{ configMapName || 'home' }}</code>; the
        editor + preview update when it saves.
      </div>
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="home-chat__msg"
        :class="`home-chat__msg--${ m.role }`"
      >
        <div class="home-chat__role">
          {{ m.role === 'user' ? 'You' : personaLabel }}
        </div>
        <div class="home-chat__bubble">
          <span v-if="m.content">{{ m.content }}</span>
          <span
            v-else-if="m.role === 'assistant' && streaming"
            class="text-muted"
          >…</span>
          <div
            v-if="m.tool"
            class="home-chat__tool text-muted"
          >
            ✎ applied the change
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="error"
      class="home-chat__error text-error"
    >
      {{ error }}
    </div>

    <div class="home-chat__input">
      <textarea
        v-model="input"
        class="home-chat__box"
        :placeholder="`Ask the ${ personaLabel } to change the page… (Enter to send, Shift+Enter for newline)`"
        :disabled="streaming"
        @keydown="onKeydown"
      />
      <button
        class="btn btn-sm role-primary"
        :disabled="streaming || !input.trim()"
        @click="send"
      >
        {{ streaming ? '…' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--body-bg);

  &__target {
    flex: 0 0 auto;
    padding: 4px 12px;
    font-size: 11px;
    border-bottom: 1px solid var(--border);

    code {
      background: var(--nav-active);
      border-radius: 4px;
      padding: 0 5px;
    }
  }

  &__log {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    min-height: 0;
  }

  &__empty {
    font-size: 12px;
    line-height: 1.5;

    code {
      background: var(--nav-active);
      border-radius: 4px;
      padding: 0 4px;
    }
  }

  &__msg {
    margin-bottom: 12px;

    &--user .home-chat__bubble {
      background: var(--nav-active);
    }
  }

  &__role {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 2px;
  }

  &__bubble {
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--box-bg, var(--nav-active));
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }

  &__tool {
    font-size: 11px;
    margin-top: 4px;
  }

  &__error {
    padding: 4px 12px;
    font-size: 12px;
  }

  &__input {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid var(--border);
  }

  &__box {
    flex: 1;
    resize: none;
    height: 48px;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--input-bg, var(--body-bg));
    color: var(--body-text);
    font-family: inherit;
    font-size: 13px;
  }
}
</style>
