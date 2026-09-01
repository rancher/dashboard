
# Keyboard shortcuts 

Shortcuts are implemented via [`vue-shortkey`](https://github.com/iFgR/vue-shortkey)

```html
<button v-shortkey.once="['n']" class="hide" @shortkey="focus()" />
```

Configuration for this is in `plugins/shortkey.js`. At the time of writing this contains options to disable keyboard shortcuts in `input`, `textarea` and `select` elements.

