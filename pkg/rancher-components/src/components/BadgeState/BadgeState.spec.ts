import { shallowMount } from '@vue/test-utils'
import { Badge } from './index'

describe('BadgeState.vue', () => {
  it('renders props.msg when passed', () => {
    const label = 'Hello, World!'

    const wrapper = shallowMount(Badge, {
      propsData: { label }
    })

    expect(wrapper.find('span').text()).toMatch(label)
  })
})
