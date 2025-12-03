import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './style.css'
import initApp from './init.js'

initApp().catch((error) => {
  console.error('Failed to initialize app:', error)
})
