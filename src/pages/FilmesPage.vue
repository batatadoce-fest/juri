<template>
  <q-page class="q-pa-md">
    <!-- Seção de Carregamento -->
    <div v-if="carregando" class="text-center q-mt-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-md text-grey-7">Buscando filmes da sua categoria...</div>
    </div>

    <!-- Seção de Erro -->
    <div v-else-if="erro" class="text-center q-mt-xl">
      <q-icon name="error" color="negative" size="50px" />
      <div class="text-h6 q-mt-md">Ocorreu um erro</div>
      <p class="text-grey-7">{{ erro }}</p>
      <q-btn label="Tentar Novamente" color="primary" @click="buscarFilmes" />
    </div>

    <!-- Conteúdo Principal -->
    <div v-else>
      <div class="text-h5 q-mb-md">Filmes para Avaliação</div>
      <div v-if="!filmes || filmes.length === 0" class="text-center q-mt-xl">
        <q-icon name="movie_filter" color="grey-5" size="50px" />
        <div class="text-h6 q-mt-md text-grey-7">Nenhum filme encontrado para sua categoria.</div>
      </div>

      <!-- Lista de Filmes -->
      <q-list v-else separator bordered>
        <q-item v-for="filme in filmes" :key="filme ? filme.id_filme : Math.random()" v-ripple>
          <!-- Miniatura do Poster -->
          <q-item-section
            v-if="filme"
            thumbnail
            class="cursor-pointer"
            @click="mostrarImagemAmpliada(filme)"
          >
            <q-img
              :src="filme.poster_src"
              style="width: 50px; height: 70px; border-radius: 3px"
              spinner-color="primary"
              spinner-size="20px"
            >
              <template v-slot:loading>
                <div class="absolute-full flex flex-center bg-grey-3">
                  <q-spinner size="20px" color="primary" />
                </div>
              </template>
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                  <q-icon name="broken_image" />
                </div>
              </template>
            </q-img>
          </q-item-section>

          <!-- Detalhes do Filme -->
          <q-item-section v-if="filme">
            <q-item-label class="text-weight-bold">{{
              filme.titulo_filme || 'Título não informado'
            }}</q-item-label>
            <q-item-label caption>Diretor(a): {{ filme.diretor || 'Não informado' }}</q-item-label>
            <q-item-label caption>Duração: {{ filme.tempo || 'Não informada' }}</q-item-label>
          </q-item-section>

          <!-- Botões de Ação -->
          <q-item-section side>
            <div class="column items-end">
              <q-btn
                v-if="isFilmeAvaliado(filme)"
                label="Editar Avaliação"
                color="accent"
                dense
                flat
                @click="abrirAvaliacao(filme)"
                class="q-mb-xs"
              />
              <q-btn
                v-else
                label="Avaliar"
                color="primary"
                dense
                flat
                @click="abrirAvaliacao(filme)"
                class="q-mb-xs"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Diálogo para Imagem Ampliada (DENTRO DO Q-PAGE) -->
    <q-dialog v-model="dialogImagem">
      <q-card style="width: 90vw; max-width: 1200px; height: 90vh">
        <q-card-section class="row items-center q-pb-none">
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none" style="height: calc(100% - 50px)">
          <iframe
            v-if="imagemAmpliadaSrc"
            :src="imagemAmpliadaSrc"
            frameborder="0"
            allowfullscreen
            style="width: 100%; height: 100%"
          ></iframe>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useUserStore } from 'src/stores/user-store'
import jsonp from 'jsonp'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

// --- Variáveis de Estado ---
const userStore = useUserStore()
const router = useRouter()
const $q = useQuasar()

const filmes = ref([])
const carregando = ref(true)
const erro = ref(null)
const avaliacoesFeitas = ref(new Set()) // Usar um Set para busca rápida O(1)
const dialogImagem = ref(false)
const imagemAmpliadaSrc = ref('')

// --- Chave da API (Substituir) ---
const GOOGLE_API_KEY = 'SUA_CHAVE_DE_API_AQUI' // <-- SUBSTITUA PELA SUA CHAVE

// --- Funções ---

/**
 * Extrai o ID do arquivo de uma URL do Google Drive.
 * @param {string} url A URL do Google Drive.
 * @returns {string|null} O ID do arquivo ou null.
 */
const getFileIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const regex =
    /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|uc\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{28,})/
  const match = url.match(regex)
  return match && match[1] ? match[1] : null
}

/**
 * Mostra o diálogo com a imagem do poster ampliada.
 * @param {object} filme O objeto do filme.
 */
const mostrarImagemAmpliada = async (filme) => {
  imagemAmpliadaSrc.value = '' // Limpa para forçar re-renderização
  await nextTick()

  const fileId = getFileIdFromUrl(filme.link_cartaz)
  if (fileId) {
    // URL correta para embed/preview
    imagemAmpliadaSrc.value = `https://drive.google.com/file/d/${fileId}/preview`
    dialogImagem.value = true
  } else {
    $q.notify({
      color: 'negative',
      message: 'Não foi possível encontrar o link da imagem para ampliar.',
      icon: 'error_outline',
    })
  }
}

/**
 * Tenta carregar a melhor imagem de poster disponível em uma sequência de fallbacks.
 * @param {object} filme O objeto do filme a ser modificado.
 */
const checkAndSetPoster = (filme) => {
  const fileId = getFileIdFromUrl(filme.link_cartaz)
  if (!fileId) {
    filme.poster_src = '' // Define como vazio se não houver ID
    return
  }

  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}`
  const fullImageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
  const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`

  const testImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = url
      img.onload = () => resolve(url)
      img.onerror = () => reject(new Error(`Falha ao carregar: ${url}`))
    })
  }

  // 1. Tenta a miniatura
  testImage(thumbnailUrl)
    .then((src) => {
      filme.poster_src = src
    })
    .catch(() => {
      // 2. Se falhar, tenta a imagem completa
      console.warn(`Miniatura falhou para ${filme.titulo_filme}. Tentando imagem completa.`)
      testImage(fullImageUrl)
        .then((src) => {
          filme.poster_src = src
        })
        .catch(() => {
          // 3. Se falhar, usa a URL da API como último recurso
          console.warn(`Imagem completa falhou para ${filme.titulo_filme}. Tentando via API.`)
          filme.poster_src = apiUrl
        })
    })
}

/**
 * Verifica se um filme já foi avaliado pelo jurado.
 * @param {object} filme O objeto do filme.
 * @returns {boolean}
 */
const isFilmeAvaliado = (filme) => {
  return avaliacoesFeitas.value.has(filme.id_filme)
}

/**
 * Navega para a página de avaliação do filme.
 * @param {object} filme O objeto do filme.
 */
const abrirAvaliacao = (filme) => {
  if (!filme || !filme.id_filme) {
    console.error('Tentativa de avaliar um filme inválido:', filme)
    return
  }
  router.push({
    name: 'avaliacao',
    params: {
      type: userStore.categoria,
      id: filme.id_filme,
    },
    query: {
      id_filme: filme.id_filme,
      link: encodeURIComponent(filme.link_filme),
      titulo: encodeURIComponent(filme.titulo_filme),
    },
  })
}

/**
 * Busca as avaliações já feitas pelo jurado para marcar os filmes na lista.
 */
const buscarAvaliacoesAnteriores = () => {
  const params = new URLSearchParams({
    action: 'getAvaliacoesPorJurado',
    id_jurado: userStore.id,
    categoria: userStore.categoria,
  })
  const baseUrl =
    'https://script.google.com/macros/s/AKfycbxCRiV-hjQ-qk208TAg4oFS8HVuQ9n1FUOqLI_SAaRmXvmsGp3QH3lir4aXZd90zeU6/exec'
  const url = `${baseUrl}?${params.toString()}`

  jsonp(url, { param: 'callback', timeout: 10000 }, (err, data) => {
    if (err) {
      console.error('Erro ao buscar avaliações anteriores:', err)
    } else if (data.success && data.avaliacoes) {
      avaliacoesFeitas.value = new Set(data.avaliacoes)
    }
  })
}

/**
 * Busca a lista de filmes da categoria do jurado.
 */
const buscarFilmes = () => {
  carregando.value = true
  erro.value = null

  const categoria = userStore.categoria
  if (!categoria) {
    erro.value = 'Sua categoria de jurado não foi encontrada. Por favor, faça login novamente.'
    carregando.value = false
    return
  }

  const params = new URLSearchParams({
    action: 'getFilmes',
    categoria: categoria,
  })
  const baseUrl =
    'https://script.google.com/macros/s/AKfycbxCRiV-hjQ-qk208TAg4oFS8HVuQ9n1FUOqLI_SAaRmXvmsGp3QH3lir4aXZd90zeU6/exec'
  const url = `${baseUrl}?${params.toString()}`

  jsonp(url, { param: 'callback', timeout: 15000 }, (err, data) => {
    carregando.value = false
    if (err) {
      erro.value = `Erro de comunicação com o servidor: ${err.message}`
    } else if (data.success) {
      filmes.value = data.filmes || []
      filmes.value.forEach((filme) => {
        if (filme && filme.link_cartaz) {
          checkAndSetPoster(filme)
        }
      })
    } else {
      erro.value = data.message || 'Ocorreu um erro desconhecido ao buscar os filmes.'
    }
  })
}

// --- Ciclo de Vida ---
onMounted(() => {
  buscarFilmes()
  buscarAvaliacoesAnteriores()
})
</script>
