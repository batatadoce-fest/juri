import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userData: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.userData,
    categoria: (state) => {
      return state.userData ? state.userData.categoria : null
    },
    nome: (state) => {
      return state.userData ? state.userData.nome_jurado : 'Jurado'
    },
    id: (state) => {
      return state.userData ? state.userData.id_jurado : null
    },
    email: (state) => {
      return state.userData ? state.userData.email_jurado : null
    },
  },

  actions: {
    setUser(userObject) {
      this.userData = userObject
      console.log('Dados do usuário salvos na store:', this.userData)
    },
    logout() {
      this.userData = null
      console.log('Dados do usuário removidos da store.')
      this.router.push('/login')
    },
  },

  // LINHA ADICIONADA
  persist: true,
})
