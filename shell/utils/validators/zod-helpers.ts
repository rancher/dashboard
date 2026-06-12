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

// NOTE: builder methods (required, url, and anything added to
// createTransformFactories) must be the last calls in a chain. Each is
// implemented by bolting extra methods onto a real Zod schema instance, so
// chaining a genuine ZodTypeAny method afterwards (.refine(), .optional(),
// .transform(), etc.) returns a plain Zod schema without these extras - any
// further .required()/.url() calls on that result will be undefined at
// runtime. If a field needs that kind of composition, apply it to the
// resulting z.object({...}) shape as a whole, or add a transform-style
// validator to createTransformFactories instead.
export type FieldBuilder = ZodTypeAny & {
  required(keyOverride?: string): FieldBuilder;
} & {
  [K in keyof TransformFactories]: (...args: Parameters<TransformFactories[K]>) => FieldBuilder;
};

export function zodValidators(t: I18n['t']) {
  const firstIssue = (schemas: ZodTypeAny[], v: string) => {
    return schemas
      .map((schema) => schema.safeParse(v))
      .find((result) => !result.success)
      ?.error
      .issues[0];
  };

  function buildSchema(transforms: Transform[], requiredKey?: string): ZodTypeAny {
    // Plain optional case (field() with no chained validators). Skip the
    // superRefine wrapper entirely since it would always be a no-op.
    if (transforms.length === 0 && requiredKey === undefined) {
      return z.preprocess((v) => v ?? '', z.string());
    }

    // Compiled once per builder state, then reused across every superRefine call
    // (e.g. every keystroke revalidation) since none of these depend on `v`.
    const compiledTransforms = transforms.map((transform) => transform(z.string()));
    const requiredSchema = requiredKey !== undefined ? z.string().refine((val) => val.trim().length > 0, t('validation.required', { key: t(requiredKey) })) : undefined;

    return z.preprocess(
      (v) => v ?? '',
      z.string().superRefine((v: string, ctx) => {
        const requiredResult = requiredSchema?.safeParse(v);
        const hasIssue = requiredResult?.success === false ? requiredResult.error.issues[0] : (!v ? undefined : firstIssue(compiledTransforms, v));

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
