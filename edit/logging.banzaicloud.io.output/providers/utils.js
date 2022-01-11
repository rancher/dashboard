export const protocol = ['http', 'https'];

// Order from newest to oldest
export const sslVersions = ['TLSv1_2', 'TLSv1_1', 'TLSv1', 'SSLv23'];

export function updatePort(setter, port) {
  // We set the value to 0 then the actual value because if we exceed the maximum of
  // 65535 all subsequent values will continue to return 65535 which vue ignores and
  // allows the user to continue appending values in the input even the the stored value
  // remains 65535.
  setter(0);
  setter(normalizePort(port));
}

export function normalizePort(port) {
  const portAsInt = Number.parseInt(port, 10);

  if (portAsInt < 1) {
    return 1;
  }

  if (portAsInt > 65535) {
    return 65535;
  }

  return portAsInt;
}
