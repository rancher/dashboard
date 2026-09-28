import { Config } from 'dompurify';

export function purifyHTML(value: string, options?: Config): string;

export function addLinkInterceptor(fn: (link: string) => string | undefined | void, name?: string): void;

export function removeLinkInterceptor(fn: (link: string) => string | undefined | void): void;

export function processLink(link: string): string;
