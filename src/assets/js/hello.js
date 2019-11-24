window.onload = function hello() {

  if ('doNotTrack' in window.navigator && window.navigator.doNotTrack === '1') {
    console.log('Respecting \'do not track\' preferences')
    return
  }

  const data = {
    userAgent: window.navigator.userAgent,
    hostname: window.location.hostname,
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
