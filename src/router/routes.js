const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'filmes', component: () => import('pages/FilmesPage.vue') },
      {
        path: 'avaliacao/:type/:id',
        name: 'avaliacao',
        component: () => import('pages/AvaliacaoPage.vue'),
        props: true,
      },
      { path: 'juri', component: () => import('pages/JuriPage.vue') },
      { path: 'alterar-senha', component: () => import('pages/AlterarSenhaPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
