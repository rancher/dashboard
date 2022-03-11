# Storybook

By default the Storybook dependencies are not included in the main package file (it adds a lot of weight to the install process).

If you run any of the targets:

- yarn storybook
- yarn build-storybook

the dependencies will be added to the `package.json` file and updated automatically.

You can manually install them with the target:

- yarn install-storybook

> Important: Do not commit an updated `package.json` file withe the Storybook dependencies

You can remove the Storybook dependencies with:

- yarn remove-storybook

# Running Storybook

Just run the command:

```
yarn storybook
```

You can access Storybook at the URL: http://127.0.0.1:6006

## Next Steps

- Port design-system pages to Storybook
- Add Typography page (for headers etc and padding and margin classes)
- Write short developer reference for how to document components and write stories
- Build out stories for components
- Auto-build via CI and publish to Github pages ?
- Add some content to the Welcome page
- Get i18n working
- Get store working (where required by a component)

## Useful links

Useful documentation links:

- https://vue-styleguidist.github.io/docs/Documenting.html#code-comments
- https://storybook.js.org/docs/react/writing-docs/doc-blocks#description
- https://github.com/storybookjs/storybook/blob/next/addons/docs/docs/docspage.md
- https://github.com/storybookjs/storybook/tree/master/addons/docs
- https://storybook.js.org/docs/react/essentials/controls
- https://storybook.js.org/docs/react/writing-docs/build-documentation
- https://storybook.js.org/docs/react/writing-docs/doc-blocks
- https://storybook.js.org/docs/react/addons/addons-api