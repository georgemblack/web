window.onload = function analytics() {

  if ('doNotTrack' in window.navigator && window.navigator.doNotTrack === '1') {
    console.log('Respecting \'do not track\' preferences')
    return
  }

  const data = {
    pathname: window.location.pathname,
    referrer: window.document.referrer,
    windowInnerWidth: window.innerWidth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  
  fetch('https://api.georgeblack.me/views', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}
