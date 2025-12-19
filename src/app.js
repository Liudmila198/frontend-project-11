import { createState } from './state.js'
import { createView } from './view.js'
import { createController } from './controller.js'

export const createApp = (i18nInstance) => {
  const elements = {
    form: document.querySelector('.rss-form'),
    urlInput: document.querySelector('#url-input'),
    feedback: document.querySelector('.feedback'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: {
      element: document.querySelector('#modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      link: document.querySelector('.full-article'),
    },
  }

  const state = createState()
  const view = createView(elements, i18nInstance)
  const controller = createController(state, view, elements, i18nInstance)

  return {
    start: () => controller.init(),
    stop: () => controller.destroy(),
    getState: () => state,
  }
}