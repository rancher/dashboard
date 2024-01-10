
export default {
  name: 'NuxtChild',
  functional: true,
  props: {
    nuxtChildKey: {
      type: String,
      default: ''
    },
    keepAlive: Boolean,
    keepAliveProps: {
      type: Object,
      default: undefined
    }
  },
  render (_, { parent, data, props }) {
    const h = parent.$createElement

    data.nuxtChild = true
    const _parent = parent
    let depth = 0

    while (parent) {
      if (parent.$vnode && parent.$vnode.data.nuxtChild) {
        depth++
      }
      parent = parent.$parent
    }
    data.nuxtChildDepth = depth

    const listeners = {}
    
    // Add triggerScroll event on beforeEnter (fix #1376)
    const beforeEnter = listeners.beforeEnter
    listeners.beforeEnter = (el) => {
      // Ensure to trigger scroll event after calling scrollBehavior
      window.$nuxt.$nextTick(() => {
        window.$nuxt.$emit('triggerScroll')
      })
      if (beforeEnter) {
        return beforeEnter.call(_parent, el)
      }
    }

    let routerView = h('routerView', data)

    if (props.keepAlive) {
      routerView = h('keep-alive', { props: props.keepAliveProps }, [routerView])
    }

    // this needs to be a "transition" or another non-rendering component, 
    // otherwise we will break pages like the charts wizard or the extensions main screen (DOM would render an additional element and break CSS)
    // we can deal with this later once we remove this component and <nuxt /> component
    return h('transition', {
      on: listeners
    }, [routerView])
  }
}
