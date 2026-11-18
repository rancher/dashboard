import { shallowMount, VueWrapper } from '@vue/test-utils';
import fetchMixin from '@shell/mixins/fetch.client.js';
import S3 from '@shell/edit/logging.banzaicloud.io.output/providers/s3.vue';

const REGIONS = ['us-east-1', 'eu-west-1'];

// The app registers this mixin globally in shell/initialize/entry.js, it is what runs fetch()
const mountS3 = (value: Record<string, string>) => shallowMount(S3, {
  props: {
    mode: 'edit', namespace: 'whatever', value
  },
  global: {
    mixins: [fetchMixin],
    mocks:  {
      $store: {
        dispatch: (action: string) => {
          if (action !== 'aws/defaultRegions') {
            throw new Error(`unexpected dispatch: ${ action }`);
          }

          return Promise.resolve([...REGIONS]);
        }
      }
    }
  }
});

describe('component: S3', () => {
  it('should display a region select showing the configured s3_region', () => {
    const value = { s3_region: 'us-east-1' };
    const wrapper = mountS3(value);

    const region = wrapper.find('[data-testid="s3-region"]');

    expect(region.exists()).toBe(true);
    expect(region.attributes('value')).toBe(value.s3_region);
  });

  it('should write the region select back to s3_region', async() => {
    const value = {};
    const wrapper = mountS3(value);

    const region = wrapper.findComponent('[data-testid="s3-region"]') as VueWrapper<any, any>;

    await region.vm.$emit('update:value', 'eu-west-1');

    expect(value).toStrictEqual({ s3_region: 'eu-west-1' });
  });

  it('should populate the region select with the known AWS regions', async() => {
    const wrapper = mountS3({});

    await wrapper.vm.$nextTick();

    const region = wrapper.findComponent('[data-testid="s3-region"]') as VueWrapper<any, any>;

    expect(region.props('options')).toStrictEqual(REGIONS);
  });

  it('should keep an existing region that is not a known AWS region as an option', async() => {
    const wrapper = mountS3({ s3_region: 'minio-local' });

    await wrapper.vm.$nextTick();

    const region = wrapper.findComponent('[data-testid="s3-region"]') as VueWrapper<any, any>;

    expect(region.props('options')).toStrictEqual(['minio-local', ...REGIONS]);
  });
});
