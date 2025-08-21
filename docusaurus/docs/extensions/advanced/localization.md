# Localization/Translation

## General usage

Generating localizations in extensions is done per package via a translation YAML file found in the `./pkg/<extension-name>/l10n` directory. If a translation is not included in the user's selected language, it will fall back to English.

As an example, you can create file called `./pkg/<extension-name>/l10n/en-us.yaml` with the following translation strings:

Form fields are conventionally defined in translations as `<some prefix>`.`<field name>`.\{label,description,enum options if applicable\} e.g.

```yml
account:
  apiKey:
    description:
      label: Description
      placeholder: Optionally enter a description to help you identify this API Key
```

And can be used in the following manner:

In HTML

```html
<t k="<path to localisation>" />
{{ t("<path to localisation>") }}
```

> `t` can be exposed via adding the i18n getter as a computed property with `...mapGetters({ t: 'i18n/t' })` using the _Options API_.

> `t` can be exposed in the following manner using the _Composition API_:
```ts
const store = useStore();
const { t } = useI18n(store);
```

Many components will also accept a localisation path via a `value-key` property, instead of the translated text in `value`.

In JS/TS

```ts
this.t('<path to localisation>')
```

A localisation can be checked with

```ts
this.$store.getters['i18n/exists']('<path to localisation>')

this.$store.getters['i18n/withFallback']('<path to localisation>', null, '<fallback>'))
```

If you wanted to have the string `Optionally enter a description to help you identify this API Key` rendered, then `<path to localisation>` would be `account.apiKey.description.placeholder`.


In the HTML example with the above key, the usage should be:
```html
<t k="account.apiKey.description.placeholder" />
{{ t('account.apiKey.description.placeholder') }}
```

## Using variables in paths

In Javascript files, variables in localisation paths must be wrapped in quotation marks when the variable contains a slash.

For example, if we want to dynamically fill in the description of a resource based on its type, we can use a `type` variable when referencing the localisation path to the description:

```ts
{
  description: this.t(`secret.typeDescriptions.'${ type }'.description`),
}
```

In this case, the quotation marks are required because some Secret types, such as `kubernetes.io/basic-auth`, include a slash.

## Advanced usages

Messages and number formatting uses [ICU templating](https://formatjs.io/docs/intl-messageformat) for very powerful pluralization and customizing. 