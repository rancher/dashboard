import * as z from 'zod';
import type { ZodString, ZodTypeAny } from 'zod';
import type { I18n } from '@shell/composables/useI18n';

export type Transform = (schema: ZodString) => ZodTypeAny;

export type FieldBuilder = ZodTypeAny & {
  url(): FieldBuilder;
  required(keyOverride?: string): FieldBuilder;
};

export function createZodHelpers(t: I18n['t']) {
  const url: Transform = (s) => s.url(t('validation.genericUrl'));

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
    const schema = buildSchema(transforms, requiredKey) as FieldBuilder;

    schema.url = () => makeBuilder(key, [...transforms, url], requiredKey);
    schema.required = (keyOverride?: string) => makeBuilder(key, transforms, keyOverride ?? key);

    return schema;
  }

  function field(key = ''): FieldBuilder {
    return makeBuilder(key, []);
  }

  return { field };
}
