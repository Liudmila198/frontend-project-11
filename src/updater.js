import { processRSS } from './parser.js'
import { generateId, updatePosts } from './state.js'

const updateFeed = (feed, existingPosts) => {
  return processRSS(feed.url)
    .then((rssData) => {
      const existingLinks = new Set(existingPosts.map(post => post.link))
      const newPosts = rssData.posts.filter(post => !existingLinks.has(post.link))
      
      return newPosts.map(post => ({
        id: generateId(),
        feedId: feed.id,
        title: post.title,
        link: post.link,
        description: post.description,
      }))
    })
    .catch((error) => {
      console.warn(`Не удалось обновить фид ${feed.url}:`, error.message)
      return []
    })
}

export const updateAllFeeds = (feeds, existingPosts) => {
  const updatePromises = feeds.map(feed => updateFeed(feed, existingPosts))
  
  return Promise.allSettled(updatePromises)
    .then((results) => {
      const allNewPosts = results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
          return acc.concat(result.value)
        }
        return acc
      }, [])
      
      return allNewPosts
    })
}

export class FeedUpdater {
  constructor() {
    this.timeoutId = null
    this.isUpdating = false
    this.updateInterval = 5000
  }

  start(autoUpdateCallback) {
    this.autoUpdateCallback = autoUpdateCallback
    this.scheduleUpdate()
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.isUpdating = false
  }

  scheduleUpdate() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    this.timeoutId = setTimeout(() => {
      this.executeUpdate()
    }, this.updateInterval)
  }

  executeUpdate() {
    if (this.isUpdating) {
      this.scheduleUpdate()
      return
    }

    this.isUpdating = true
    
    if (this.autoUpdateCallback) {
      this.autoUpdateCallback()
        .finally(() => {
          this.isUpdating = false
          this.scheduleUpdate()
        })
    } else {
      this.isUpdating = false
      this.scheduleUpdate()
    }
  }
}