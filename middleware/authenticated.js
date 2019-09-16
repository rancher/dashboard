// import { RANCHER } from '@/utils/types';

export default async function({ route, store, redirect }) {
  console.log('--------------------------------------');
  console.log('Authenticated middleware');
  console.log('Route: ', `${ route.fullPath }(${ route.name })`);
  console.log('--------------------------------------');

  try {
    console.log('Loading principal');

    // const principals = await store.dispatch('rancher/findAll', {
    //  type: RANCHER.PRINCIPAL,
    //  opt:  { url: '/v3/principals?me=true' }
    // });

    const principals = [
      {
        baseType:       'principal',
        created:        null,
        creatorId:      null,
        id:             'github_user://753917',
        loginName:      'vincent99',
        me:             true,
        memberOf:       false,
        name:           'Vincent Fiduccia',
        principalType:  'user',
        profilePicture: 'https://avatars0.githubusercontent.com/u/753917?v=4',
        provider:       'github',
        type:           'principal'
      },
    ];

    console.log('Got principal', principals);

    store.commit('auth/loggedInAs', principals[0]);

    await store.dispatch('preload');
  } catch (e) {
    console.log('Not logged in', e);
    redirect(302, '/auth/login');
  }
}
