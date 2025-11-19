import axios from 'axios'

// Прокси для обхода CORS
const ALL_ORIGINS_URL = 'https://allorigins.hexlet.app/get'

// Функция для получения RSS через прокси
export const fetchRss = (url) => {
  const proxyUrl = new URL(ALL_ORIGINS_URL)
  proxyUrl.searchParams.set('url', url)
  proxyUrl.searchParams.set('disableCache', 'true')

  return axios.get(proxyUrl.toString())
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('network_error')
      }
      return response.data.contents
    })
    .catch((error) => {
      if (error.response) {
        throw new Error('network_error')
      }
      throw error
    })
}

// Чистая функция для парсинга RSS
export const parseRss = (rssString) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rssString, 'text/xml')

  // Проверка на ошибки парсинга
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('invalid_rss')
  }

  // Извлечение данных фида
  const channel = doc.querySelector('channel');
  if (!channel) {
    throw new Error('invalid_rss');
  }

  const feed = {
    title: channel.querySelector('title')?.textContent || 'Без названия',
    description: channel.querySelector('description')?.textContent || 'Без описания',
  };

  // Извлечение постов
  const items = doc.querySelectorAll('item');
  const posts = Array.from(items).map((item, index) => ({
    id: `${Date.now()}_${index}`, // Генерация уникального ID
    title: item.querySelector('title')?.textContent || 'Без названия',
    description: item.querySelector('description')?.textContent || 'Без описания',
    link: item.querySelector('link')?.textContent || '#',
    pubDate: item.querySelector('pubDate')?.textContent || '',
  }))

  return { feed, posts }
}

// Основная функция для загрузки и парсинга RSS
export const loadRssFeed = (url) => {
  return fetchRss(url)
    .then((rssString) => parseRss(rssString))
    .then(({ feed, posts }) => {
      // Добавляем URL к данным фида
      const feedWithUrl = {
        ...feed,
        url,
        id: Date.now().toString(), // Генерация ID для фида
      }

      // Добавляем ID фида к постам
      const postsWithFeedId = posts.map(post => ({
        ...post,
        feedId: feedWithUrl.id,
      }))

      return { feed: feedWithUrl, posts: postsWithFeedId }
    })
}
