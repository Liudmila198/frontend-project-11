import * as yup from 'yup'
import i18next from 'i18next'
import { processRSS } from './parser.js'

yup.setLocale({
  string: {
    url: () => ({ key: 'errors.invalidUrl' }),
    required: () => ({ key: 'errors.required' }),
  },
  mixed: {
    notOneOf: () => ({ key: 'errors.alreadyExists' }),
  },
})

export const createSchema = (existingUrls) => yup.object({
  url: yup
    .string()
    .required()
    .url()
    .notOneOf(existingUrls),
})

export const validateForm = (url, existingUrls) => {
  const schema = createSchema(existingUrls)
  
  return schema.validate({ url }, { abortEarly: false })
    .then(() => processRSS(url))
    .then(() => ({ success: true }))
    .catch((error) => {
      let errorKey = 'errors.invalidUrl'
      
      if (error.name === 'ValidationError') {
        if (error.params && error.params.key) {
          errorKey = error.params.key
        } else if (error.errors && error.errors[0] && error.errors[0].key) {
          errorKey = error.errors[0].key
        }
      } else if (error.message === 'network_error') {
        errorKey = 'errors.networkError'
      } else if (error.message === 'invalid_rss') {
        errorKey = 'errors.invalidRss'
      }
      
      return { 
        success: false, 
        error: i18next.t(errorKey)
      }
    })
}