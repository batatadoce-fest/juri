import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Cria a instância da Pinia
const pinia = createPinia()

// Usa o plugin de persistência
pinia.use(piniaPluginPersistedstate)

// Exporta a instância para ser usada pelo Quasar
export default ({ app }) => {
  app.use(pinia)
}
