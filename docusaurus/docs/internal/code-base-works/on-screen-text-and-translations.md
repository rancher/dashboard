
# On-screen Text and Translations

This page covers Internationalisation (i18n) and localisation (l10n).


## Internationalization (i18n)

Any code producing messages, labels, numbers, dates, times, and the like should use the `i18n` store and translation strings to generate and format them instead of hardcoding English or American-isms anywhere.   Messages and number formatting uses [ICU templating](https://formatjs.io/docs/intl-messageformat) for very powerful pluralization and customizing.

The `assets/translations` dir stores a YAML file with translations for each supported language.
  - English is automatically used as the "fallback" if a particular key is missing from a non-English language.
  - If you don't have a native translation for a particular key, just leave that key out of the language
  - Do not duplicate the English string into other languages.

Translations should be the largest phrase that makes sense as a single key, rather than several separate things rendered in a fixed order.
  - For example "about 2 minutes remaining" should be a single translation: `About {n, number} {n, plural, one { minute }, other { minutes }} remaining`.
  - Not one for `About`, one for `minute`, one for `minutes`, one for `remaining`, and some code picking and choosing which to concatenate.

All on screen text should be localised and implemented in the default `en-US` locale. There are different ways to access localised text

> `t` can be exposed via adding the i18n getter as a computed property with `...mapGetters({ t: 'i18n/t' })`

In HTML

```html
<t k="<path to localisation>" />
{{ t("<path to localisation>") }}
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

## Using Variables in i18n Paths

In Javascript files, variables in localisation paths must be wrapped in quotation marks when the variable contains a slash.

For example, if we want to dynamically fill in the description of a resource based on its type, we can use a `type` variable when referencing the localisation path to the description:

```ts
{
  description: this.t(`secret.typeDescriptions.'${ type }'.description`),
}
```

In this case, the quotation marks are required because some Secret types, such as `kubernetes.io/basic-auth`, include a slash.

## l10n 

Localisation files can be found in `./assets/translations/en-us.yaml`.

Please follow precedents in file to determine where new translations should be place.

Form fields are conventionally defined in translations as `<some prefix>`.`<field name>`.\{label,description,enum options if applicable\} e.g.

```yml
account:
  apiKey:
    description:
      label: Description
      placeholder: Optionally enter a description to help you identify this API Key
```

If a translation is not included in the user's selected language, it will fall back to English. The only time the Rancher UI devs should modify a non-English translation is when a key is renamed.


## Checking for missing translation strings

The script `scripts/check-i18n` can be used to check for missing translation strings.

It uses a set of regular expressions to detect for translation strings being used in the code base. It will report any string references that it finds that it does not find a corresponding translation for - this is an indication of a missing translation string.

This script is run as part of the dashboard Continuos Integration via GitHub actions.

The script accepts two optional arguments:

- -s Print out the details of translations strings found in the localisation files that don't appear to be used by the code
- -x Don't set the exit code if there are errors detected

### Comments

Since the script uses regular expressions, there are cases where it might:

- Incorrectly detect a use of a translation string in the code that is not such
- Not be able to detect that a translation string has been used

To address these issues, you need to use comments in your code to assist the i18n checker script.

Comments can be placed at the start of the line, or as part of a line of code at the end. They can not be added to templates, so
comments should be added at the top of the code file for these.

#### i18n-uses

You can use a comment of the form:

```
// i18n-uses TRANSLATION
```

to indicate that the string `TRANSLATION` is used in the code.

#### i18n-ignore

You can use a comment of the form:

```
// i18n-ignore TRANSLATION
```

to indicate that the string `TRANSLATION` should be ignored and is not a reference to a translation string.

#### Translation Strings

With both `i18n-uses` and `i18n-ignore`, the `TRANSLATION` string can be:

- A simple string, e.g. `area.subarea.name`
- A regular expression, e.g. `/area\.subarea\.name/`
- A simple string with wild-cards specified using `*`, e.g. `area.subarea.*` or `area.*.name`
