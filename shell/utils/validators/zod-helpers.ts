import * as z from 'zod';
import type { ZodString, ZodTypeAny } from 'zod';
import type { I18n } from '@shell/composables/useI18n';

export type Transform = (schema: ZodString) => ZodTypeAny;

// Erased view of a transform factory used only when iterating the registry
// below - individual factories keep their real parameter types via
// TransformFactories/FieldBuilder.
type TransformFactory = (...args: any[]) => Transform;

// Factories for validators that simply append a Transform to a field's
// pipeline. Each closes over the field's own key so it can default messages to
// it (e.g. url's keyOverride || fieldKey || undefined). Add new transform-style
// validators here. FieldBuilder and makeBuilder pick them up automatically.
function createTransformFactories(t: I18n['t'], fieldKey: string) {
  return {
    url: (keyOverride?: string): Transform => {
      const key = keyOverride || fieldKey || undefined;

      return (s) => s.url(key ? t('validation.url', { key: t(key) }) : t('validation.genericUrl'));
    },
  };
}

type TransformFactories = ReturnType<typeof createTransformFactories>;

export type FieldBuilder = ZodTypeAny & {
  required(keyOverride?: string): FieldBuilder;
} & {
  [K in keyof TransformFactories]: (...args: Parameters<TransformFactories[K]>) => FieldBuilder;
};

export function createZodHelpers(t: I18n['t']) {
  const firstIssue = (transforms: Transform[], v: string) => {
    return transforms
      .map((transform) => transform(z.string()).safeParse(v))
      .find((result) => !result.success)
      ?.error
      .issues[0];
  };

  function buildSchema(transforms: Transform[], requiredKey?: string): ZodTypeAny {
    return z.preprocess(
      (v) => v ?? '',
      z.string().superRefine((v: string, ctx) => {
        const requiredResult = requiredKey ? z.string().min(1, t('validation.required', { key: t(requiredKey) })).safeParse(v) : undefined;

        const hasIssue = requiredResult?.success === false ? requiredResult.error.issues[0] : (!v ? undefined : firstIssue(transforms, v));

        if (hasIssue) {
          ctx.addIssue(hasIssue);
        }
      })
    );
  }

  function makeBuilder(key: string, transforms: Transform[], requiredKey?: string): FieldBuilder {
    const schema = buildSchema(transforms, requiredKey);
    const factories = Object.entries(createTransformFactories(t, key)) as [string, TransformFactory][];

    const transformMethods = Object.fromEntries(factories.map(([name, factory]) => [
      name,
      (...args: unknown[]) => makeBuilder(key, [...transforms, factory(...args)], requiredKey),
    ]));

    return Object.assign(
      schema,
      transformMethods,
      { required: (keyOverride?: string) => makeBuilder(key, transforms, keyOverride ?? key) }
    ) as unknown as FieldBuilder;
  }

  function field(key = ''): FieldBuilder {
    return makeBuilder(key, []);
  }

  return { field };
}
