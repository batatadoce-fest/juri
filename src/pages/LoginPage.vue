<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-md shadow-2" style="width: 400px; max-width: 90vw; border-radius: 15px">
      <q-card-section class="text-center">
        <div class="text-h6 text-primary text-weight-bold">Área do Jurado</div>
        <div class="text-subtitle2 text-grey-7">Acesse com seu e-mail e senha</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="loginData.email"
          label="E-mail"
          outlined
          type="email"
          @keyup.enter="fazerLogin"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <q-input
          v-model="loginData.senha"
          label="Senha"
          outlined
          type="password"
          @keyup.enter="fazerLogin"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions vertical class="q-gutter-y-sm">
        <q-btn
          label="Entrar"
          color="primary"
          class="full-width q-py-sm"
          rounded
          @click="fazerLogin"
          :loading="carregando"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user-store'
import jsonp from 'jsonp'

// Ferramentas do Router e Store
const router = useRouter()
const userStore = useUserStore()

// Estados de controle da interface
const carregando = ref(false)

// Dados reativos para formulários
const loginData = reactive({
  email: '',
  senha: '',
})

/**
 * Lógica principal de Autenticação com JSONP
 */
const fazerLogin = () => {
  if (!loginData.email || !loginData.senha) {
    alert('Preencha seu e-mail e senha.')
    return
  }

  carregando.value = true

  const baseUrl =
    'https://script.google.com/macros/s/AKfycbxCRiV-hjQ-qk208TAg4oFS8HVuQ9n1FUOqLI_SAaRmXvmsGp3QH3lir4aXZd90zeU6/exec'
  const params = new URLSearchParams({
    action: 'login',
    email: loginData.email.trim().toLowerCase(),
    senha: loginData.senha.trim(),
  })

  const url = `${baseUrl}?${params.toString()}`

  // A chamada JSONP
  jsonp(url, { param: 'callback', timeout: 15000 }, (err, data) => {
    carregando.value = false

    if (err) {
      console.error('Erro na chamada JSONP:', err)
      alert(`Erro de comunicação: ${err.message}`)
    } else {
      console.log('Dados recebidos do backend:', data)
      if (data.success) {
        // *** ESTA É A LINHA CRUCIAL ***
        // Passamos o objeto de usuário completo para a store.
        userStore.setUser(data.user)

        alert(`Bem-vindo, ${data.user.nome_jurado}!`)
        router.push('/filmes')
      } else {
        alert(data.message || 'Credenciais inválidas.')
      }
    }
  })
}
</script>

<style scoped>
.q-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
