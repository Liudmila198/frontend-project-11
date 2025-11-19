import * as yup from 'yup'
import i18n from './i18n.js'

yup.setLocale({
  mixed: {
    required: () => i18n.t('errors.required'),
    notOneOf: () => i18n.t('errors.notOneOf'),
  },
  string: {
    url: () => i18n.t('errors.url'),
  },
})

export const createRssSchema = (existingUrls = []) => {
  return yup.object().shape({
    url: yup
      .string()
      .required()
      .url()
      .notOneOf(existingUrls),
  })
}

export const getValidationError = (error) => {
  if (error instanceof yup.ValidationError) {
    return error.message
  }
  
  // Обработка ошибок сети и парсинга
  if (error.message === 'network_error') {
    return i18n.t('errors.network')
  }
  
  if (error.message === 'invalid_rss') {
    return i18n.t('errors.invalidRss')
  }
  
  return i18n.t('errors.unknown')
}