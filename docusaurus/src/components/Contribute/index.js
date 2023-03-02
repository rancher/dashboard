import React from 'react';
import clsx from 'clsx';
import SlackLogo from '@site/static/img/slack-logo.svg';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

const ContributeList = [
  {
    link:        'https://slack.rancher.io/',
    target:      '_blank',
    imgDark:     'img/slack-logo.svg',
    imgLight:    'img/slack-logo-light.svg',
    description: (
      <>
        Join <strong>Rancher Users</strong> on Slack and start connecting with our community, learning from others and sharing knowledge.
      </>
    ),
  },
  {
    title:       'Components & Design kit',
    link:        'https://github.com/rancher',
    target:      '_blank',
    imgDark:     'img/GitHub-logo.svg',
    imgLight:    'img/GitHub-Logo-light.png',   
    description: (
      <>
        Check all <strong>Rancher repos</strong> on GitHub.
      </>
    ),
  },
];

function Contribute( {
  imgDark, imgLight, description, link, target
} ) {
  return (
    <div className={clsx('col col--6')}>
      <a className="contributeLink" href={link} target={target}>
        <ThemedImage alt="GitHub-Logo"
          sources={{
            light: useBaseUrl(`${imgDark}`),
            dark: useBaseUrl(`${imgLight}`),
          }}
        />
        <p>{description}</p>
      </a>
    </div>
  );
}

export default function HomepageFeatures() {
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
