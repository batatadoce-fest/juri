<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar style="height: 80px">
        <q-toolbar-title class="flex flex-center">
          <div class="absolute-center" style="width: 225px; height: 225px">
            <img
              src="~assets/logo/logo.svg"
              class="fit-contain"
              style="width: 100%; height: 100%"
            />
          </div>
        </q-toolbar-title>

        <!-- Menu de usuário com dropdown -->
        <q-btn-dropdown
          v-if="userStore.isLoggedIn"
          stretch
          flat
          icon="account_circle"
          dropdown-icon="none"
        >
          <q-list>
            <q-item-label header>Olá, {{ userStore.nome }}</q-item-label>
            <q-item clickable v-close-popup @click="fazerLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Sair</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useUserStore } from 'src/stores/user-store'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

function fazerLogout() {
  userStore.logout()
  // Redireciona para a página de login após o logout
  router.push('/login')
}
</script>
