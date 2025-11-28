import { fetchRSS } from './rss.js'

export const parseRSS = (data) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(data, 'text/xml')

  const errorNode = doc.querySelector('parsererror')
  if (errorNode) {
    throw new Error('invalid_rss')
  }

  const channel = doc.querySelector('channel')
  if (!channel) {
    throw new Error('invalid_rss')
  }

  const feedTitle = channel.querySelector('title')?.textContent || 'Без названия'
  const feedDescription = channel.querySelector('description')?.textContent || 'Без описания'

  const items = doc.querySelectorAll('item')
  const posts = Array.from(items).map((item) => {
    const title = item.querySelector('title')?.textContent || 'Без названия'
    const link = item.querySelector('link')?.textContent || '#'
    const description = item.querySelector('description')?.textContent || ''

    return {
      title: title.trim(),
      link: link.trim(),
      description: description.trim(),
    }
  }).filter(post => post.title && post.link)

  return {
    feed: {
      title: feedTitle.trim(),
      description: feedDescription.trim(),
    },
    posts,
  }
}

export const processRSS = (url) => {
  return fetchRSS(url)
    .then((data) => {
      const parsedData = parseRSS(data)
      return {
        url,
        ...parsedData,
      }
    })
}