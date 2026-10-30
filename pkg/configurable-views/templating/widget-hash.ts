/**
 * The SHA-256 of a widget's source, as hex - what an approval records, so an approval covers exactly
 * the code an admin read.
 */
export async function widgetHash(source: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));

  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
