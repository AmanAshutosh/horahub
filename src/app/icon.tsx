import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Generated favicon — resolves the /favicon.ico 404 with no static asset to source. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1D2D50',
          borderRadius: '50%',
          color: '#F1CBB8',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'serif',
        }}
      >
        H
      </div>
    ),
    { ...size },
  );
}
