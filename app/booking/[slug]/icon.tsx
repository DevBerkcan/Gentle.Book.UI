import { ImageResponse } from 'next/og'
import { getTenantInfo } from '@/lib/api/booking'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

const GB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="19" r="11.5" stroke="#6355E4" stroke-width="5"/><path d="M35.5 19 V29.5 a11.5 11.5 0 0 1 -19 8.6" stroke="#6355E4" stroke-width="5" stroke-linecap="round"/><circle cx="34.6" cy="10.4" r="3.1" fill="#17A398"/></svg>`

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export default async function Icon({ params }: { params: { slug: string } }) {
  let logoUrl: string | null = null
  let primaryColor = '#6355E4'
  let initial = 'G'

  try {
    const info = await getTenantInfo(params.slug)
    primaryColor = info.primaryColor ?? '#6355E4'
    const name = info.companyName ?? info.name ?? ''
    initial = name.trim()[0]?.toUpperCase() ?? 'G'

    if (info.logoUrl) {
      logoUrl = info.logoUrl.startsWith('http')
        ? info.logoUrl
        : `${API_BASE}${info.logoUrl}`
    }
  } catch {
    // Fall back to GentleBook defaults
  }

  // Tenant has a logo — show it on white background
  if (logoUrl) {
    return new ImageResponse(
      <div
        style={{
          width: 64,
          height: 64,
          background: 'white',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} width={56} height={56} alt="" style={{ objectFit: 'contain' }} />
      </div>,
      { width: 64, height: 64 }
    )
  }

  // No tenant logo — use primary color + company initial
  // If primary color equals the GentleBook default, show the G mark instead
  if (primaryColor === '#6355E4' || !initial || initial === 'G') {
    const src = `data:image/svg+xml;base64,${btoa(GB_SVG)}`
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

  // Tenant has a custom color — use it as background with their initial
  return new ImageResponse(
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 14,
        background: primaryColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 36,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          lineHeight: 1,
        }}
      >
        {initial}
      </div>
    </div>,
    { width: 64, height: 64 }
  )
}
