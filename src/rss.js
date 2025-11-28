import axios from 'axios'

const ALL_ORIGINS_URL = 'https://allorigins.hexlet.app/get'

export const fetchRSS = (url) => {
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