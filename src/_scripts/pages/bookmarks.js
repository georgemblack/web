fetch('https://api.georgeblack.me/bookmarks', {
  method: 'GET',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  const bookmarks = data.bookmarks
  const frame = document.querySelector('.bookmarks')
  bookmarks.forEach(bookmark => {
    const node = document.createElement('p')
    const anchor = document.createElement('a')
    const text = document.createTextNode(bookmark.title)
    anchor.appendChild(text)
    anchor.title = bookmark.title
    anchor.href = bookmark.url
    node.appendChild(anchor)
    frame.appendChild(node)
  })
})
