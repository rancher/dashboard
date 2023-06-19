import React from 'react';
import clsx from 'clsx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

const GuidesList = [
  {
    title:  'Building an Image for Container Registries',
    link:   'guide/build-for-container-registry',
    target: '',
  },
  {
    title:  'Package Management',
    link:   'guide/package-management',
    target: '',
  },
  {
    title:  'Auth Providers',
    link:   'guide/auth-providers',
    target: '',
  },
];

function Guides({ title, link, target }) {
  return (
    <div className={clsx('col col--4')}>
      <a className="guideLink" href={link} target={target}>
        <ThemedImage alt="GitHub-Logo"
          sources={{
            light: useBaseUrl('/img/guides.svg'),
            dark:  useBaseUrl('/img/guides-light.svg'),
          }}
        />
        <div className="padding-horiz--md">
          <h2 className='exterl-link'>{title}</h2>
        </div>
      </a>
    </div>
  );
}

export default function GuidesFeatures() {
  return (
    <div>
      <h1>Guides</h1>
      <div className="row">
        {GuidesList.map((props, idx) => (
          <Guides key={idx} {...props} />
        ))}
      </div>
    </div>
  );
}
