import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="19" r="11.5" stroke="white" stroke-width="5"/><path d="M35.5 19 V29.5 a11.5 11.5 0 0 1 -19 8.6" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="34.6" cy="10.4" r="3.1" fill="#17A398"/></svg>`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6355E4 0%, #4A3FC7 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 140,
            height: 140,
            borderRadius: 32,
            background: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/svg+xml;base64,${Buffer.from(GB_SVG).toString('base64')}`}
            width={90}
            height={90}
            alt=""
          />
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'sans-serif',
            letterSpacing: -1,
          }}
        >
          GentleBook
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'sans-serif',
            marginTop: 16,
          }}
        >
          Das Buchungssystem für Salons, Beauty &amp; mehr
        </div>
      </div>
    ),
    { ...size }
  )
}
