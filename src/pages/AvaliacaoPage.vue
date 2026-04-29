<template>
  <q-page class="q-pa-md">
    <div v-if="filmeLink">
      <div class="text-h6 text-weight-bold q-mb-md">{{ tituloFilme || 'Avaliação do Filme' }}</div>

      <!-- Player de Vídeo -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12">
          <q-video :src="embedUrl" style="width: 100%; height: 70vh" />
        </div>
      </div>

      <!-- Critérios de Avaliação -->
      <div class="q-mt-lg">
        <div class="text-h6">Notas</div>

        <!-- Spinner de Carregamento para as Notas -->
        <div v-if="carregandoNotas" class="text-center q-pa-lg">
          <q-spinner-dots color="primary" size="40px" />
          <div class="q-mt-md text-grey-7">Carregando notas...</div>
        </div>

        <!-- Sliders de Avaliação -->
        <div v-else>
          <div v-for="criterio in criteriosDeAvaliacao" :key="criterio.slug" class="q-mt-md">
            <q-item-label class="q-mb-sm text-subtitle1">{{ criterio.nome }}</q-item-label>
            <q-slider
              v-model="criterio.nota"
              :min="0"
              :max="10"
              label-always
              :label-value="criterio.nota"
              :color="getSliderColor(criterio.nota)"
              class="q-px-sm"
            />
          </div>
        </div>
      </div>

      <!-- Botões de Ação -->
      <div class="q-mt-xl q-gutter-md text-center">
        <q-btn label="Salvar Avaliação" color="primary" @click="salvar" />
        <q-btn label="Cancelar" color="grey" @click="cancelar" flat />
      </div>
    </div>
    <div v-else class="text-center q-mt-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-md text-grey-7">Carregando dados da avaliação...</div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user-store'
import { useQuasar } from 'quasar'
import jsonp from 'jsonp'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const $q = useQuasar()

const filmeLink = ref(null)
const tituloFilme = ref('')
const criteriosDeAvaliacao = ref([])
const carregando = ref(false)
const carregandoNotas = ref(true) // Adiciona o estado de carregamento das notas

const embedUrl = computed(() => {
  if (!filmeLink.value) return null

  try {
    const url = new URL(filmeLink.value)
    let videoId

    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      videoId = url.searchParams.get('v') || url.pathname.split('/').pop()
      return `https://www.youtube.com/embed/${videoId}`
    }
    // A lógica do Vimeo foi removida
  } catch (e) {
    // Se não for uma URL válida, retorna o link original
    console.warn('URL do filme não pôde ser processada, usando link direto:', filmeLink.value, e)
    return filmeLink.value
  }

  return filmeLink.value
})

// Lógica para definir os critérios baseados na categoria do jurado
const getCriteriosPorCategoria = (categoria) => {
  const base = [
    { nome: 'Roteiro', nota: 5, slug: 'nota_roteiro' },
    { nome: 'Direção de Arte', nota: 5, slug: 'nota_direcao_arte' },
  ]

  // Normaliza a categoria para garantir a correspondência
  const categoriaNormalizada = (categoria || '').trim().toLowerCase()

  switch (categoriaNormalizada) {
    case 'nacional':
      return [
        ...base,
        { nome: 'Técnica de animação', nota: 5, slug: 'nota_tecnica' },
        { nome: 'Efeitos Sonoros', nota: 5, slug: 'nota_efeitos' },
        { nome: 'Trilha Sonora', nota: 5, slug: 'nota_trilha' },
      ]
    case '2d':
      return [
        ...base,
        { nome: 'Animação Frame a Frame', nota: 5, slug: 'nota_frame_a_frame' },
        { nome: 'Animação Cut-Out', nota: 5, slug: 'nota_cut_out' },
      ]
    case '3d':
      return [
        ...base,
        { nome: 'Animação', nota: 5, slug: 'nota_tecnica' },
        { nome: 'Iluminação', nota: 5, slug: 'nota_iluminacao' },
        { nome: 'Look Dev', nota: 5, slug: 'nota_look_dev' },
      ]
    case 'stopmotion':
      return [
        ...base,
        { nome: 'Animação', nota: 5, slug: 'nota_tecnica' },
        { nome: 'Fotografia', nota: 5, slug: 'nota_fotografia' },
      ]
    case 'tcc':
      return [
        ...base,
        { nome: 'Animação', nota: 5, slug: 'nota_tecnica' },
        { nome: 'Som', nota: 5, slug: 'nota_fotografia' },
      ]
    default:
      return base
  }
}

onMounted(() => {
  if (route.query.link) {
    filmeLink.value = decodeURIComponent(route.query.link)
    if (route.query.titulo) {
      tituloFilme.value = decodeURIComponent(route.query.titulo)
    }
  }

  // O id_filme agora está em route.query.id_filme
  // O email do jurado está em userStore.email

  // Normaliza a categoria do jurado para garantir compatibilidade com backend
  const categoriaDoJuri = (userStore.categoria || '').trim().toLowerCase()
  criteriosDeAvaliacao.value = getCriteriosPorCategoria(categoriaDoJuri)

  carregarAvaliacaoExistente()
})

const carregarAvaliacaoExistente = () => {
  carregandoNotas.value = true // Inicia o carregamento
  const categoriaNormalizada = (userStore.categoria || '').trim().toLowerCase()
  const params = new URLSearchParams({
    action: 'getAvaliacao',
    id_filme: route.query.id_filme,
    id_jurado: userStore.id,
    categoria: categoriaNormalizada,
  })

  const baseUrl =
    'https://script.google.com/macros/s/AKfycbxCRiV-hjQ-qk208TAg4oFS8HVuQ9n1FUOqLI_SAaRmXvmsGp3QH3lir4aXZd90zeU6/exec'
  const url = `${baseUrl}?${params.toString()}`

  jsonp(url, { param: 'callback', timeout: 10000 }, (err, data) => {
    if (err) {
      console.error('Erro ao buscar avaliação existente:', err.message)
      carregandoNotas.value = false // Finaliza o carregamento em caso de erro
      return
    }

    if (data.success && data.avaliacao) {
      criteriosDeAvaliacao.value.forEach((criterio) => {
        if (Object.prototype.hasOwnProperty.call(data.avaliacao, criterio.slug)) {
          const notaSalva = data.avaliacao[criterio.slug]
          if (typeof notaSalva === 'number') {
            criterio.nota = notaSalva
          }
        }
      })
    }
    // Se não houver sucesso ou não houver 'avaliacao', não faz nada,
    // mantendo as notas padrão.
    carregandoNotas.value = false // Finaliza o carregamento após o sucesso
  })
}

const getSliderColor = (nota) => {
  if (nota < 4) return 'negative'
  if (nota < 7) return 'warning'
  return 'positive'
}

const salvar = () => {
  carregando.value = true

  const notas = {}
  criteriosDeAvaliacao.value.forEach((criterio) => {
    notas[criterio.slug] = criterio.nota
  })

  const categoriaNormalizada = (userStore.categoria || '').trim().toLowerCase()
  const params = new URLSearchParams({
    action: 'saveAvaliacao',
    id_filme: route.query.id_filme, // Corrigido para buscar da query
    id_jurado: userStore.id,
    email_jurado: userStore.email,
    titulo_filme: tituloFilme.value,
    categoria: categoriaNormalizada,
    ...notas,
  })

  const baseUrl =
    'https://script.google.com/macros/s/AKfycbxCRiV-hjQ-qk208TAg4oFS8HVuQ9n1FUOqLI_SAaRmXvmsGp3QH3lir4aXZd90zeU6/exec'
  const url = `${baseUrl}?${params.toString()}`
  console.log('URL de salvamento:', url) // Para depuração

  jsonp(url, { param: 'callback', timeout: 15000 }, (err, data) => {
    carregando.value = false
    if (err) {
      $q.notify({
        color: 'negative',
        message: `Erro de comunicação com o servidor: ${err.message}`,
      })
    } else {
      if (data.success) {
        $q.notify({
          color: 'positive',
          message: 'Avaliação salva com sucesso!',
        })
        router.push('/filmes')
      } else {
        $q.notify({
          color: 'negative',
          message: data.message || 'Não foi possível salvar a avaliação.',
        })
      }
    }
  })
}

const cancelar = () => {
  router.push('/filmes')
}
</script>
