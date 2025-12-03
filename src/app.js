import { createState } from './state.js'
import { createView } from './view.js'
import { createController } from './controller.js'

// Создание приложения
export const createApp = () => {
  // Получаем DOM элементы
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
  
  // Создаем состояние
  const state = createState()
  
  // Создаем представление
  const view = createView(elements)
  
  // Создаем контроллер
  const controller = createController(state, view, elements)
  
  // Инициализируем
  controller.init()
  
  return { state, view, controller }
}