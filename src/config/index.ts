export { env } from './env';

export const APP = {
  name: 'HoraHub',
  description: 'Computed nine-graha charts with sourced, citation-backed interpretation.',
  chartCacheTtlSeconds: 60 * 60 * 24 * 30,
} as const;
