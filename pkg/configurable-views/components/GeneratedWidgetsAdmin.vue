<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useShell } from '@shell/apis';
import { NotificationLevel } from '@shell/types/notifications';
import { BadgeState } from '@components/BadgeState';
import {
  generatedWidgets, widgetApprovals, setWidgetApproval, deleteGeneratedWidget, fetchTemplatingConfigMaps
} from '../templating/template-engine';
import { widgetHash } from '../templating/widget-hash';
import { reviewWidget } from '../templating/widget-review';

// The widgets Liz wrote, and the gate in front of them: an admin reads each one's code and approves
// it. Approving records the hash of the code as it is, so a widget runs only as long as its code is
// what was read - a change sends it back here. Revoking stops it everywhere at once.

const store = useStore();
const { t } = useI18n(store);
const shell = useShell();

const widgets = computed(() => generatedWidgets(store.getters));

// What a reviewer should know before approving: the Rancher components each one draws with, and
// what it built by hand or reached for outside what it is given
const reviews = computed(() => Object.fromEntries(widgets.value.map((w) => [w.name, reviewWidget(w.source)])));
const approvals = computed(() => widgetApprovals(store.getters));

// Each widget's code, hashed - what an approval is compared with
const hashes = ref<Record<string, string>>({});

watch(widgets, async(list) => {
  const out: Record<string, string> = {};

  for (const w of list) {
    out[w.name] = await widgetHash(w.source);
  }
  hashes.value = out;
}, { immediate: true });

type Status = 'pending' | 'approved' | 'changed';

function statusOf(name: string): Status {
  const approved = approvals.value[name];

  if (!approved) {
    return 'pending';
  }

  return approved === hashes.value[name] ? 'approved' : 'changed';
}

const COLOR: Record<Status, string> = {
  pending: 'bg-warning', approved: 'bg-success', changed: 'bg-error'
};

const open = ref<Record<string, boolean>>({});
const busy = ref('');

async function run(name: string, action: () => Promise<void>, done: string): Promise<void> {
  busy.value = name;

  try {
    await action();
    await fetchTemplatingConfigMaps(store);
    shell.notification.send(NotificationLevel.Success, t('configurableViews.generatedAdmin.title'), done);
  } catch (e) {
    shell.notification.send(NotificationLevel.Error, t('configurableViews.generatedAdmin.failed'), (e as Error)?.message || String(e));
  } finally {
    busy.value = '';
  }
}

const approve = (name: string) => run(name, () => setWidgetApproval(store, name, hashes.value[name]), t('configurableViews.generatedAdmin.approved', { name }));
const revoke = (name: string) => run(name, () => setWidgetApproval(store, name, null), t('configurableViews.generatedAdmin.revoked', { name }));
const remove = (name: string) => run(name, () => deleteGeneratedWidget(store, name), t('configurableViews.generatedAdmin.deleted', { name }));
</script>

<template>
  <div class="gwa">
    <h2 class="mb-5">
      {{ t('configurableViews.generatedAdmin.title') }}
    </h2>
    <p class="text-muted mb-15">
      {{ t('configurableViews.generatedAdmin.intro') }}
    </p>

    <p
      v-if="!widgets.length"
      class="text-muted"
    >
      {{ t('configurableViews.generatedAdmin.none') }}
    </p>

    <div
      v-for="w in widgets"
      :key="w.name"
      class="gwa__item"
      :data-testid="`generated-widget-${ w.name }`"
    >
      <div class="gwa__head">
        <div class="gwa__name">
          <strong>{{ w.displayName }}</strong>
          <span class="text-muted">{{ w.name }}</span>
        </div>
        <BadgeState
          :label="t(`configurableViews.generatedAdmin.status.${ statusOf(w.name) }`)"
          :color="COLOR[statusOf(w.name)]"
        />
      </div>
      <p
        v-if="w.description"
        class="gwa__desc"
      >
        {{ w.description }}
      </p>

      <div class="gwa__review">
        <span class="text-muted">{{ t('configurableViews.generatedAdmin.uses') }}</span>
        <span
          v-for="c in reviews[w.name].components"
          :key="c"
          class="gwa__component"
        >{{ c }}</span>
        <span
          v-if="!reviews[w.name].components.length"
          class="text-muted"
        >{{ t('configurableViews.generatedAdmin.usesNone') }}</span>
      </div>
      <ul
        v-if="reviews[w.name].findings.length"
        class="gwa__findings"
        :data-testid="`generated-widget-findings-${ w.name }`"
      >
        <li
          v-for="f in reviews[w.name].findings"
          :key="f"
        >
          <i class="icon icon-warning" />
          {{ t(`configurableViews.generatedAdmin.finding.${ f }`, { names: reviews[w.name].unknown.join(', ') }) }}
        </li>
      </ul>

      <div class="gwa__actions">
        <button
          class="btn btn-sm role-secondary"
          @click="open[w.name] = !open[w.name]"
        >
          {{ open[w.name] ? t('configurableViews.generatedAdmin.hideCode') : t('configurableViews.generatedAdmin.showCode') }}
        </button>
        <button
          v-if="statusOf(w.name) !== 'approved'"
          class="btn btn-sm role-primary"
          :disabled="busy === w.name || !hashes[w.name]"
          :data-testid="`generated-widget-approve-${ w.name }`"
          @click="approve(w.name)"
        >
          {{ statusOf(w.name) === 'changed' ? t('configurableViews.generatedAdmin.approveAgain') : t('configurableViews.generatedAdmin.approve') }}
        </button>
        <button
          v-if="statusOf(w.name) !== 'pending'"
          class="btn btn-sm role-secondary"
          :disabled="busy === w.name"
          @click="revoke(w.name)"
        >
          {{ t('configurableViews.generatedAdmin.revoke') }}
        </button>
        <button
          class="btn btn-sm role-link"
          :disabled="busy === w.name"
          @click="remove(w.name)"
        >
          {{ t('configurableViews.generatedAdmin.delete') }}
        </button>
      </div>

      <pre
        v-if="open[w.name]"
        class="gwa__code"
      >{{ w.source }}</pre>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gwa {
  margin-top: 40px;
  max-width:  960px;

  &__item {
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    margin-bottom: 12px;
    padding:       14px 16px;
  }

  &__head {
    align-items:     center;
    display:         flex;
    gap:             12px;
    justify-content: space-between;
  }

  &__name {
    display:        flex;
    flex-direction: column;
    gap:            2px;
  }

  &__desc {
    margin: 8px 0 0;
  }

  &__review {
    align-items: center;
    display:     flex;
    flex-wrap:   wrap;
    gap:         6px;
    margin-top:  10px;
  }

  &__component {
    background:    var(--body-bg);
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    font-family:   monospace;
    font-size:     12px;
    padding:       1px 6px;
  }

  &__findings {
    color:      var(--warning);
    list-style: none;
    margin:     10px 0 0;
    padding:    0;

    li {
      margin: 2px 0;
    }
  }

  &__actions {
    display:    flex;
    flex-wrap:  wrap;
    gap:        8px;
    margin-top: 12px;
  }

  &__code {
    background:    var(--body-bg);
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    font-size:     12px;
    margin:        12px 0 0;
    max-height:    420px;
    overflow:      auto;
    padding:       10px;
    white-space:   pre;
  }
}
</style>
