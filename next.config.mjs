/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  serverExternalPackages: ['sweph', 'pino'],
  // kb/graph and kb/rules are read via runtime fs calls with a computed base
  // path (process.cwd()); static bundling analysis can miss them, so list
  // them explicitly to guarantee they ship with the chart API's function.
  outputFileTracingIncludes: {
    '/api/chart': ['./kb/graph/**', './kb/rules/**/rules.jsonl'],
    '/api/chart/[id]': ['./kb/graph/**', './kb/rules/**/rules.jsonl'],
  },
  async headers() {
    const scriptSrc =
      process.env.NODE_ENV === 'development'
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'";
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; ${scriptSrc}; connect-src 'self' https://geocoding-api.open-meteo.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
          }
        ]
      }
    ];
  }
};
export default nextConfig;
