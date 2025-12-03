import { createState } from './state.js'
import { createView } from './view.js'
import { createController } from './controller.js'

export const createApp = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    urlInput: document.getElementById('url-input'),
    feedback: document.querySelector('.feedback'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: {
      element: document.getElementById('modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      link: document.querySelector('.full-article'),
    },
  }

  const state = createState()
  const view = createView(elements)
  const controller = createController(state, view, elements)

  controller.init()

  return { state, view, controller }
}
