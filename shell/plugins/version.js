import { setIsRancherPrime } from '@shell/config/version';
export default async function({ $axios }) {
  try {
    const response = await $axios.get('/rancherversion');

    setIsRancherPrime(response.data);
    // TODO: Set value using setIsRancherPrime
  } catch (e) {
    console.log('Failed to fetch Ranhcer Version', e); // eslint-disable-line no-console
  }
}
