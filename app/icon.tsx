import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="19" r="11.5" stroke="#6355E4" stroke-width="5"/><path d="M35.5 19 V29.5 a11.5 11.5 0 0 1 -19 8.6" stroke="#6355E4" stroke-width="5" stroke-linecap="round"/><circle cx="34.6" cy="10.4" r="3.1" fill="#17A398"/></svg>`

export default function Icon() {
  const src = `data:image/svg+xml;base64,${btoa(SVG)}`
  return new ImageResponse(
    <div
      style={{
        width: 64,
        height: 64,
        background: '#F6F5FA',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={48} height={48} alt="" />
    </div>,
    { width: 64, height: 64 }
  )
}
