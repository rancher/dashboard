import React from 'react';
import clsx from 'clsx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

const ContributeList = [
  {
    link:        'https://slack.rancher.io/',
    target:      '_blank',
    imgDark:     'img/slack-logo.svg',
    imgLight:    'img/slack-logo-light.svg',
    atlText:     'Slack-logo',
    description: (
      <>
        Join <strong>Rancher Users</strong> on Slack and start connecting with our community, learning from others and sharing knowledge.
      </>
    ),
  },
  {
    title:       'GitHub',
    link:        'https://github.com/rancher/dashboard',
    target:      '_blank',
    imgDark:     'img/GitHub-logo.svg',
    imgLight:    'img/GitHub-logo-light.svg',
    atlText:     'GitHub-logo',
    description: (
      <>
        Check out the Rancher Dashboard repository on GitHub.
      </>
    ),
  },
];

function Contribute( {
  imgDark, imgLight, description, link, target, atlText
} ) {
  return (
    <div className={clsx('col col--6')}>
      <a className="contributeLink" href={link} target={target}>
        <ThemedImage alt={atlText}
          sources={{
            light: useBaseUrl(`${ imgDark }`),
            dark:  useBaseUrl(`${ imgLight }`),
          }}
        />
        <p>{description}</p>
      </a>
    </div>
  );
}

export default function ContributeFeatures() {
  return (
    <div>
      <h1>Contribute</h1>
      <div className="row">
        {ContributeList.map((props, idx) => (
          <Contribute key={idx} {...props} />
        ))}
      </div>
    </div>
  );
}
