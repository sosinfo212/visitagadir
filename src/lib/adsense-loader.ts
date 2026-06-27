let adsenseScriptLoaded = false
let adsenseScriptLoading = false

export function loadAdSenseScript(publisherId: string) {
  if (
    adsenseScriptLoaded ||
    adsenseScriptLoading ||
    !publisherId ||
    publisherId === 'ca-pub-XXXXXXXXXXXXXXXX'
  ) {
    return
  }

  adsenseScriptLoading = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
  script.crossOrigin = 'anonymous'
  script.onload = () => {
    adsenseScriptLoaded = true
    adsenseScriptLoading = false
  }
  script.onerror = () => {
    adsenseScriptLoading = false
  }
  document.head.appendChild(script)
}
