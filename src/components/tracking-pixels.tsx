'use client'

import { useEffect } from 'react'

interface Pixel {
  id: string
  type: string
  pixelId: string | null
  customCode: string | null
}

// Tracks which pixels are already mounted (per page-load) so React StrictMode
// or repeated renders don't inject duplicate scripts / fire duplicate PageViews.
const mountedPixels = new Set<string>()

function appendScript(id: string, src: string, attrs: Record<string, string> = {}) {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.async = true
  s.src = src
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v))
  document.head.appendChild(s)
}

function appendInlineScript(id: string, code: string) {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.innerHTML = code
  document.head.appendChild(s)
}

function appendNoscript(id: string, html: string) {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const ns = document.createElement('noscript')
  ns.id = id
  ns.innerHTML = html
  document.body.appendChild(ns)
}

function appendMeta(id: string, name: string, content: string) {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const m = document.createElement('meta')
  m.id = id
  m.setAttribute('name', name)
  m.setAttribute('content', content)
  document.head.appendChild(m)
}

function appendRawHtml(id: string, html: string, target: 'head' | 'body') {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const wrapper = document.createElement('div')
  wrapper.id = id
  wrapper.innerHTML = html
  // Move children out so scripts execute and don't sit inside a div
  const parent = target === 'head' ? document.head : document.body
  while (wrapper.firstChild) {
    const node = wrapper.firstChild
    // If it's a <script>, browsers won't execute it unless we clone it
    if (node.nodeName === 'SCRIPT') {
      const orig = node as HTMLScriptElement
      const fresh = document.createElement('script')
      Array.from(orig.attributes).forEach(a => fresh.setAttribute(a.name, a.value))
      fresh.text = orig.text
      parent.appendChild(fresh)
      wrapper.removeChild(orig)
    } else {
      parent.appendChild(node)
    }
  }
  // Marker so we don't reinject
  const marker = document.createElement('meta')
  marker.id = id
  marker.setAttribute('data-pixel-marker', 'true')
  document.head.appendChild(marker)
}

function injectPixel(pixel: Pixel) {
  if (mountedPixels.has(pixel.id)) return
  mountedPixels.add(pixel.id)

  const pid = (pixel.pixelId || '').trim()
  const code = (pixel.customCode || '').trim()

  switch (pixel.type) {
    // ── Facebook Pixel ───────────────────────────────────────
    case 'facebook': {
      if (!pid) return
      appendInlineScript(
        `fb-pixel-${pixel.id}`,
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pid}');fbq('track','PageView');`
      )
      appendNoscript(
        `fb-pixel-ns-${pixel.id}`,
        `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pid}&ev=PageView&noscript=1"/>`
      )
      return
    }

    // ── TikTok Pixel ─────────────────────────────────────────
    case 'tiktok': {
      if (!pid) return
      appendInlineScript(
        `tt-pixel-${pixel.id}`,
        `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${pid}');ttq.page();}(window,document,'ttq');`
      )
      return
    }

    // ── Google Analytics (GA4) ───────────────────────────────
    case 'ga4': {
      if (!pid) return
      appendScript(`ga4-src-${pixel.id}`, `https://www.googletagmanager.com/gtag/js?id=${pid}`)
      appendInlineScript(
        `ga4-init-${pixel.id}`,
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${pid}');`
      )
      return
    }

    // ── Google Tag Manager ───────────────────────────────────
    case 'gtm': {
      if (!pid) return
      appendInlineScript(
        `gtm-${pixel.id}`,
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${pid}');`
      )
      appendNoscript(
        `gtm-ns-${pixel.id}`,
        `<iframe src="https://www.googletagmanager.com/ns.html?id=${pid}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
      )
      return
    }

    // ── Google Search Console (meta tag verification) ────────
    case 'gsc': {
      // pixelId field stores the verification content string
      // Optionally the admin can paste the full <meta /> tag in customCode
      if (pid) {
        appendMeta(`gsc-${pixel.id}`, 'google-site-verification', pid)
      } else if (code) {
        appendRawHtml(`gsc-raw-${pixel.id}`, code, 'head')
      }
      return
    }

    // ── Free-form custom HTML ────────────────────────────────
    case 'custom_head': {
      if (!code) return
      appendRawHtml(`custom-head-${pixel.id}`, code, 'head')
      return
    }
    case 'custom_body': {
      if (!code) return
      appendRawHtml(`custom-body-${pixel.id}`, code, 'body')
      return
    }
  }
}

export default function TrackingPixels() {
  useEffect(() => {
    let cancelled = false
    fetch('/api/pixels')
      .then(r => (r.ok ? r.json() : []))
      .then((pixels: Pixel[]) => {
        if (cancelled || !Array.isArray(pixels)) return
        pixels.forEach(injectPixel)
      })
      .catch(() => { /* fail silently — tracking is non-critical */ })
    return () => { cancelled = true }
  }, [])

  return null
}
