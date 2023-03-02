import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.css';
import SlackLogo from '@site/static/img/slack-logo.svg';


const ContributeList = [
  {
    link:        'https://slack.rancher.io/',
    target:      '_blank',
    Img:         <SlackLogo title="Slack Logo" />,
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
    Img:         <img src={require('@site/static/img/GitHub-Logo.png').default} className="logo-Gh" />,
    description: (
      <>
        Check all <strong>Rancher repos</strong> on GitHub.
      </>
    ),
  },
];

function Contribute( {
  Img, description, link, target
} ) {
  return (
    <div className={clsx('col col--6')}>
      <a className="contributeLink" href={link} target={target}>
        {Img}
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
