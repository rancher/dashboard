import React from 'react';
import { useLocation } from '@docusaurus/router';

import DocsVersionDropdownNavbarItem from '@theme-original/NavbarItem/DocsVersionDropdownNavbarItem';

export default function DocsVersionDropdownNavbarItemWrapper(props) {
  const location = useLocation();

  // Only show the version dropdown when on `/extensions` paths
  const showVersionDropdown = location.pathname.startsWith('/extensions');

  return (
    <>
      {showVersionDropdown && (
        <DocsVersionDropdownNavbarItem {...props} />
      )}
    </>
  );
}
