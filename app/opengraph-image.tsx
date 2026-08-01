export const size = { width: 1200, height: 630 }
export const contentType = 'image/svg+xml'

const OG_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6355E4"/>
      <stop offset="100%" stop-color="#4A3FC7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(600 250)">
    <rect x="-70" y="-70" width="140" height="140" rx="32" fill="rgba(255,255,255,0.12)"/>
    <g transform="translate(-24 -24)">
      <circle cx="24" cy="19" r="11.5" stroke="white" stroke-width="5" fill="none"/>
      <path d="M35.5 19 V29.5 a11.5 11.5 0 0 1 -19 8.6" stroke="white" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="34.6" cy="10.4" r="3.1" fill="#17A398"/>
    </g>
  </g>
  <text x="600" y="400" text-anchor="middle" fill="white" font-size="72" font-weight="800" font-family="Arial, sans-serif" letter-spacing="-1">GentleBook</text>
  <text x="600" y="455" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="30" font-family="Arial, sans-serif">Das Buchungssystem fuer Salons, Beauty und mehr</text>
</svg>`

export default function OpengraphImage() {
  return new Response(OG_SVG, {
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
