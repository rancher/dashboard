import { setIsRancherPrime } from '@shell/config/version';
export default function({ $axios }) {
  try {
    // const response = await $axios.get('/rancherversion');

    // setIsRancherPrime(response.data);
  } catch (e) {
    console.log('Failed to fetch Ranhcer Version', e); // eslint-disable-line no-console
  }
}
