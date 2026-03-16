<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { CodeMirror, foldByLineMatch, foldByYamlPath, foldMatchingLines, foldYamlPath } from '@rancher/codemirror'
import type { CodeMirrorProps } from '@rancher/codemirror'
import type { EditorView } from '@codemirror/view'

// YAML editor state
const yamlContent = ref(`# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: default
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.21
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
`)

// JSON editor state
const jsonContent = ref(JSON.stringify({
  name: '@rancher/codemirror',
  version: '0.1.0',
  description: 'Vue 3 CodeMirror 6 component library',
  features: ['YAML', 'JSON', 'Vim mode', 'Emacs mode', 'One Dark theme'],
  config: {
    lineNumbers: true,
    foldGutter: true,
    lineWrapping: false
  }
}, null, 2))

// Shared controls
const yamlKeymap = ref<CodeMirrorProps['keymap']>('vim')
const jsonKeymap = ref<CodeMirrorProps['keymap']>('emacs')
const theme = ref<CodeMirrorProps['theme']>('one-dark')
const readOnly = ref(false)
const lineNumbers = ref(true)
const lineWrapping = ref(false)

// Custom fold example (indent strategy for YAML)
const customFoldOptions = { strategy: 'indent' as const }

// Declarative fold rules: register fold services for specific patterns
const yamlFoldExtensions = [
  foldByLineMatch(/^spec:\s*$/),
  foldByYamlPath('metadata.labels'),
]

// EditorView refs exposed from the component
const yamlEditorView = shallowRef<EditorView>()
const jsonEditorView = shallowRef<EditorView>()

function onYamlReady(v: EditorView) {
  yamlEditorView.value = v
  console.log('[playground] YAML editor ready', v)
  // Imperatively auto-fold on load
  foldMatchingLines(v, /^spec:\s*$/)
  foldYamlPath(v, 'metadata.labels')
}

function onJsonReady(v: EditorView) {
  jsonEditorView.value = v
  console.log('[playground] JSON editor ready', v)
}

const keymapOptions: CodeMirrorProps['keymap'][] = ['default', 'vim', 'emacs']
const themeOptions: CodeMirrorProps['theme'][] = ['none', 'one-dark']
</script>

<template>
  <div class="playground">
    <header class="header">
      <h1>@rancher/codemirror <span class="badge">playground</span></h1>

      <div class="controls">
        <label>
          Theme
          <select v-model="theme">
            <option v-for="t in themeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>

        <label>
          <input type="checkbox" v-model="readOnly" />
          Read-only
        </label>

        <label>
          <input type="checkbox" v-model="lineNumbers" />
          Line numbers
        </label>

        <label>
          <input type="checkbox" v-model="lineWrapping" />
          Line wrapping
        </label>
      </div>
    </header>

    <main class="editors">
      <!-- YAML Editor -->
      <section class="editor-panel">
        <div class="editor-header">
          <h2>YAML</h2>
          <label>
            Keymap
            <select v-model="yamlKeymap">
              <option v-for="k in keymapOptions" :key="k" :value="k">{{ k }}</option>
            </select>
          </label>
        </div>

        <div class="editor-container">
          <CodeMirror
            v-model="yamlContent"
            language="yaml"
            :keymap="yamlKeymap"
            :theme="theme"
            :read-only="readOnly"
            :line-numbers="lineNumbers"
            :line-wrapping="lineWrapping"
            :fold-gutter="true"
            :fold-options="customFoldOptions"
            :extensions="yamlFoldExtensions"
            @ready="onYamlReady"
            @change="(v) => console.log('yaml change', v.length, 'chars')"
          />
        </div>

        <div class="preview">
          <strong>v-model preview ({{ yamlContent.length }} chars)</strong>
          <pre>{{ yamlContent.slice(0, 200) }}{{ yamlContent.length > 200 ? '…' : '' }}</pre>
        </div>
      </section>

      <!-- JSON Editor -->
      <section class="editor-panel">
        <div class="editor-header">
          <h2>JSON</h2>
          <label>
            Keymap
            <select v-model="jsonKeymap">
              <option v-for="k in keymapOptions" :key="k" :value="k">{{ k }}</option>
            </select>
          </label>
        </div>

        <div class="editor-container">
          <CodeMirror
            v-model="jsonContent"
            language="json"
            :keymap="jsonKeymap"
            :theme="theme"
            :read-only="readOnly"
            :line-numbers="lineNumbers"
            :line-wrapping="lineWrapping"
            :fold-gutter="true"
            @ready="onJsonReady"
            @change="(v) => console.log('json change', v.length, 'chars')"
          />
        </div>

        <div class="preview">
          <strong>v-model preview ({{ jsonContent.length }} chars)</strong>
          <pre>{{ jsonContent.slice(0, 200) }}{{ jsonContent.length > 200 ? '…' : '' }}</pre>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
.playground {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  padding: 12px 20px;
  background: #0f0f1a;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}

.header h1 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #a78bfa;
}

.badge {
  font-size: 0.65rem;
  background: #312e81;
  color: #c4b5fd;
  padding: 2px 6px;
  border-radius: 4px;
  vertical-align: middle;
  margin-left: 6px;
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #aaa;
  cursor: pointer;
}

.controls select {
  background: #1e1e3a;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.8rem;
}

.editors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
  overflow: hidden;
}

.editor-panel:last-child {
  border-right: none;
}

.editor-header {
  padding: 8px 16px;
  background: #13132a;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.editor-header h2 {
  font-size: 0.9rem;
  color: #7dd3fc;
  font-weight: 500;
}

.editor-header label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #888;
}

.editor-header select {
  background: #1e1e3a;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.8rem;
}

.editor-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.editor-container .cm-editor {
  height: 100%;
  min-height: 200px;
}

.preview {
  padding: 10px 16px;
  background: #0a0a1a;
  border-top: 1px solid #333;
  flex-shrink: 0;
  max-height: 120px;
  overflow: auto;
}

.preview strong {
  font-size: 0.75rem;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.preview pre {
  font-size: 0.75rem;
  color: #aaa;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
