<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-md" style="width: 400px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Alterar Senha</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="alterarSenha">
          <q-input
            v-model="senhaAtual"
            label="Senha Atual"
            type="password"
            filled
            lazy-rules
            :rules="[(val) => !!val || 'Por favor, digite sua senha atual']"
            class="q-mb-md"
          />
          <q-input
            v-model="novaSenha"
            label="Nova Senha"
            type="password"
            filled
            lazy-rules
            :rules="[
              (val) => !!val || 'Por favor, digite sua nova senha',
              (val) => val.length >= 6 || 'A senha deve ter pelo menos 6 caracteres',
            ]"
            class="q-mb-md"
          />
          <q-input
            v-model="confirmarNovaSenha"
            label="Confirmar Nova Senha"
            type="password"
            filled
            lazy-rules
            :rules="[
              (val) => !!val || 'Por favor, confirme sua nova senha',
              (val) => val === novaSenha || 'As senhas não coincidem',
            ]"
            class="q-mb-md"
          />

          <q-btn
            label="Alterar Senha"
            type="submit"
            color="primary"
            class="full-width"
            :loading="carregando"
          />

          <q-banner v-if="erro" inline-actions class="text-white bg-red q-mt-md">
            {{ erro }}
          </q-banner>
          <q-banner v-if="sucesso" inline-actions class="text-white bg-green q-mt-md">
            {{ sucesso }}
          </q-banner>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from 'src/stores/user-store'
import jsonp from 'jsonp'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const senhaAtual = ref('')
const novaSenha = ref('')
const confirmarNovaSenha = ref('')
const carregando = ref(false)
const erro = ref(null)
const sucesso = ref(null)

const alterarSenha = () => {
  if (novaSenha.value !== confirmarNovaSenha.value) {
    erro.value = 'As senhas não coincidem.'
    return
  }

  carregando.value = true
  erro.value = null
  sucesso.value = null

  const baseUrl =
    'https://script.google.com/macros/s/AKfycbxCRiV-hjQ-qk208TAg4oFS8HVuQ9n1FUOqLI_SAaRmXvmsGp3QH3lir4aXZd90zeU6/exec'
  const params = new URLSearchParams({
    action: 'changePassword',
    email: userStore.email,
    oldPassword: senhaAtual.value,
    newPassword: novaSenha.value,
  })

  const url = `${baseUrl}?${params.toString()}`

  jsonp(url, { param: 'callback', timeout: 15000 }, (err, data) => {
    carregando.value = false
    if (err) {
      console.error('Erro ao alterar a senha:', err)
      erro.value = `Erro de comunicação com o servidor: ${err.message}`
    } else {
      if (data.success) {
        sucesso.value = data.message || 'Senha alterada com sucesso!'
        setTimeout(() => {
          userStore.logout()
          router.push('/login')
        }, 3000)
      } else {
        console.error('Erro retornado pelo backend:', data.message)
        erro.value = data.message || 'Não foi possível alterar a senha.'
      }
    }
  })
}
</script>
