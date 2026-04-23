var idSheet = '1GgTJ8_N27-Pv2PtyGhD7Bekosd1-7LqNN1lQ9btxHaQ'
var nameSheetJurados = 'jurados'
var nameSheetFilmes = 'filmes'

function doGet(e) {
  Logger.log('>> doGet: Início da execução. Ação: ' + e.parameter.action)
  var callback = e.parameter.callback
  var action = e.parameter.action

  try {
    var result
    switch (action) {
      case 'login':
        var paramsLogin = { email: e.parameter.email, senha: e.parameter.senha }
        result = handleLogin(paramsLogin)
        break
      case 'getFilmes':
        var categoria = e.parameter.categoria
        result = getFilmesPorCategoria(categoria)
        break
      case 'getAvaliacoesPorJurado':
        result = getAvaliacoesPorJurado(e.parameter)
        break
      case 'getAvaliacao':
        result = getAvaliacao(e.parameter)
        break
      case 'saveAvaliacao':
        result = saveAvaliacao(e.parameter)
        break
      default:
        result = { success: false, message: 'Ação não especificada ou inválida.' }
    }

    var jsonp = callback + '(' + JSON.stringify(result) + ')'
    return ContentService.createTextOutput(jsonp).setMimeType(ContentService.MimeType.JAVASCRIPT)
  } catch (error) {
    Logger.log('!! ERRO CRÍTICO em doGet: ' + error.toString() + ' | Stack: ' + error.stack)
    var errorResult = {
      success: false,
      message: 'Erro crítico no servidor: ' + error.toString(),
      error: error,
    }
    var jsonpError = callback + '(' + JSON.stringify(errorResult) + ')'
    return ContentService.createTextOutput(jsonpError).setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    )
  }
}

function getFilmesPorCategoria(categoria) {
  if (!categoria) {
    return { success: false, message: 'Categoria não fornecida.' }
  }

  try {
    var sheet = SpreadsheetApp.openById(idSheet).getSheetByName(nameSheetFilmes)
    if (!sheet) {
      return { success: false, message: 'A planilha de filmes não foi encontrada.' }
    }

    // *** ESTA É A LINHA CORRETA ***
    // Usamos getDisplayValues() para pegar os valores como eles aparecem na planilha (texto)
    var displayValues = sheet.getDataRange().getDisplayValues()

    if (displayValues.length <= 1) {
      return { success: false, message: 'Nenhum filme encontrado na planilha.' }
    }

    var cabecalho = displayValues[0].map((c) =>
      String(c || '')
        .toLowerCase()
        .trim(),
    )
    const idxCategoria = cabecalho.indexOf('categoria')

    if (idxCategoria === -1) {
      return { success: false, message: 'Erro de configuração na planilha de filmes.' }
    }

    var filmesFiltrados = []
    var categoriaBusca = String(categoria).toLowerCase().trim()

    for (var i = 1; i < displayValues.length; i++) {
      var row = displayValues[i]
      var categoriaFilme = String(row[idxCategoria] || '')
        .toLowerCase()
        .trim()

      if (categoriaFilme === categoriaBusca) {
        var filmeData = {}
        for (var j = 0; j < cabecalho.length; j++) {
          var key = cabecalho[j]
          if (key) {
            // Agora todos os valores já são texto, então só precisamos atribuir
            filmeData[key] = row[j]
          }
        }
        filmesFiltrados.push(filmeData)
      }
    }

    return {
      success: true,
      message: 'Filmes carregados com sucesso.',
      filmes: filmesFiltrados,
    }
  } catch (e) {
    Logger.log('!! ERRO CRÍTICO em getFilmesPorCategoria: ' + e.message + '\nStack: ' + e.stack)
    return {
      success: false,
      message: 'Ocorreu um erro inesperado ao buscar os filmes.',
      error: e.message,
    }
  }
}

function handleLogin(params) {
  Logger.log('>> handleLogin: Iniciando busca pelo usuário.')
  try {
    var sheet = SpreadsheetApp.openById(idSheet).getSheetByName(nameSheetJurados)
    if (!sheet) {
      Logger.log("!! ERRO: A planilha '" + nameSheetJurados + "' não foi encontrada.")
      return { success: false, message: 'A planilha de dados não foi encontrada.' }
    }
    Logger.log(">> handleLogin: Planilha '" + nameSheetJurados + "' acessada com sucesso.")

    var values = sheet.getDataRange().getValues()
    if (values.length <= 1) {
      Logger.log('!! AVISO: A planilha não contém dados (além do cabeçalho).')
      return { success: false, message: 'Nenhum dado de jurado para verificar.' }
    }
    Logger.log('>> handleLogin: ' + values.length + ' linhas de dados encontradas.')

    var cabecalho = values[0].map((c) =>
      String(c || '')
        .toLowerCase()
        .trim(),
    )
    Logger.log('>> handleLogin: Cabeçalho processado: ' + JSON.stringify(cabecalho))

    const idxEmail = cabecalho.indexOf('email_jurado')
    const idxSenha = cabecalho.indexOf('senha')
    const idxCategoria = cabecalho.indexOf('categoria')

    if (idxEmail === -1 || idxSenha === -1) {
      Logger.log("!! ERRO: Colunas 'email_jurado' ou 'senha' não encontradas no cabeçalho.")
      return {
        success: false,
        message: 'Erro de configuração: colunas essenciais não encontradas.',
      }
    }
    Logger.log(
      '>> handleLogin: Índices das colunas - Email: ' +
        idxEmail +
        ', Senha: ' +
        idxSenha +
        ', Categoria: ' +
        idxCategoria,
    )

    var userEmail = String(params.email || '')
      .toLowerCase()
      .trim()
    var userSenha = String(params.senha || '').trim()

    for (var i = 1; i < values.length; i++) {
      var row = values[i]

      if (!row || !row[idxEmail]) {
        continue
      }

      var emailPlanilha = String(row[idxEmail] || '')
        .toLowerCase()
        .trim()

      if (emailPlanilha === userEmail) {
        Logger.log('>> handleLogin: Email correspondente encontrado na linha ' + (i + 1))
        var senhaPlanilha = String(row[idxSenha] || '').trim()

        if (senhaPlanilha === userSenha) {
          Logger.log('>> handleLogin: Senha correspondente! Login bem-sucedido.')

          var userData = {}
          for (var j = 0; j < cabecalho.length; j++) {
            var key = cabecalho[j]
            if (key) {
              userData[key] = String(row[j] || '')
            }
          }

          return {
            success: true,
            message: 'Login realizado com sucesso!',
            user: userData,
          }
        } else {
          Logger.log('>> handleLogin: Senha incorreta para o email ' + userEmail)
          return { success: false, message: 'Senha incorreta.' }
        }
      }
    }

    Logger.log(
      ">> handleLogin: Nenhum email correspondente a '" +
        userEmail +
        "' foi encontrado após varrer a planilha.",
    )
    return { success: false, message: 'Email não encontrado.' }
  } catch (e) {
    Logger.log(
      '!! ERRO CRÍTICO em handleLogin na linha ' +
        e.lineNumber +
        ': ' +
        e.message +
        '\nStack: ' +
        e.stack,
    )
    return {
      success: false,
      message: 'Ocorreu um erro inesperado no servidor durante o login.',
      error: e.message,
      stack: e.stack,
    }
  }
}

function getAvaliacoesPorJurado(params) {
  try {
    var idJurado = params.id_jurado
    var categoria = params.categoria

    if (!idJurado || !categoria) {
      return { success: false, message: 'ID do jurado ou categoria não fornecidos.' }
    }

    var sheetName = 'juri_' + categoria.trim().toLowerCase()
    var sheet = SpreadsheetApp.openById(idSheet).getSheetByName(sheetName)

    if (!sheet) {
      // Se a planilha não existe, significa que nenhuma avaliação foi feita para essa categoria ainda.
      return { success: true, avaliacoes: [] }
    }

    var data = sheet.getDataRange().getValues()
    if (data.length <= 1) {
      return { success: true, avaliacoes: [] }
    }

    var cabecalho = data[0]
    var idJuradoCol = cabecalho.indexOf('id_jurado')
    var idFilmeCol = cabecalho.indexOf('id_filme')

    if (idJuradoCol === -1 || idFilmeCol === -1) {
      return { success: false, message: 'Erro de configuração na planilha de avaliações.' }
    }

    var avaliacoesFeitas = []
    for (var i = 1; i < data.length; i++) {
      if (data[i][idJuradoCol] == idJurado) {
        avaliacoesFeitas.push(data[i][idFilmeCol]) // Adiciona o id_filme à lista
      }
    }

    return { success: true, avaliacoes: avaliacoesFeitas }
  } catch (e) {
    Logger.log('!! ERRO CRÍTICO em getAvaliacoesPorJurado: ' + e.message + '\nStack: ' + e.stack)
    return { success: false, message: 'Erro ao buscar avaliações: ' + e.message }
  }
}

function saveAvaliacao(params) {
  try {
    var categoria = params.categoria
    if (!categoria) {
      return { success: false, message: 'Categoria do jurado não fornecida.' }
    }

    var sheetName = 'juri_' + categoria.trim().toLowerCase()
    var sheet = SpreadsheetApp.openById(idSheet).getSheetByName(sheetName)

    // Se a planilha não existir, cria uma com o cabeçalho
    if (!sheet) {
      sheet = SpreadsheetApp.openById(idSheet).insertSheet(sheetName)
      var cabecalho = [
        'id_avaliacao',
        'id_filme',
        'id_jurado',
        'email_jurado',
        'titulo_filme',
        'data_avaliacao',
        'nota_roteiro',
        'nota_direcao_arte',
        'nota_tecnica',
        'nota_efeitos',
        'nota_trilha',
        'nota_frame_a_frame',
        'nota_cut_out',
        'nota_iluminacao',
        'nota_look_dev',
        'nota_fotografia',
      ]
      sheet.appendRow(cabecalho)
    }

    var idFilme = params.id_filme
    var idJurado = params.id_jurado

    var data = sheet.getDataRange().getValues()
    var cabecalhoAvaliacao = data[0]
    var idFilmeCol = cabecalhoAvaliacao.indexOf('id_filme')
    var idJuradoCol = cabecalhoAvaliacao.indexOf('id_jurado')
    var idAvaliacaoCol = cabecalhoAvaliacao.indexOf('id_avaliacao')

    var existingRowIndex = -1
    var existingIdAvaliacao = null

    // A busca deve ser feita com conversão para String para evitar erros de tipo (número vs texto)
    for (var i = 1; i < data.length; i++) {
      if (
        String(data[i][idFilmeCol]).trim() == String(idFilme).trim() &&
        String(data[i][idJuradoCol]).trim() == String(idJurado).trim()
      ) {
        existingRowIndex = i + 1 // Linha da planilha (base 1)
        existingIdAvaliacao = data[i][idAvaliacaoCol]
        break
      }
    }

    var rowData = {
      id_filme: idFilme,
      id_jurado: idJurado,
      email_jurado: params.email_jurado || '',
      titulo_filme: params.titulo_filme || '',
      data_avaliacao: new Date(),
      nota_roteiro: params.nota_roteiro || '',
      nota_direcao_arte: params.nota_direcao_arte || '',
      nota_tecnica: params.nota_tecnica || '',
      nota_efeitos: params.nota_efeitos || '',
      nota_trilha: params.nota_trilha || '',
      nota_frame_a_frame: params.nota_frame_a_frame || '',
      nota_cut_out: params.nota_cut_out || '',
      nota_iluminacao: params.nota_iluminacao || '',
      nota_look_dev: params.nota_look_dev || '',
      nota_fotografia: params.nota_fotografia || '',
    }

    if (existingRowIndex !== -1) {
      // ATUALIZAÇÃO: Mantém o ID de avaliação existente
      rowData.id_avaliacao = existingIdAvaliacao || Utsimilities.getUuid() // Usa o ID antigo, ou gera um novo se estiver em branco por algum motivo

      var linhaParaAtualizar = cabecalhoAvaliacao.map(function (col) {
        return rowData[col] || ''
      })
      sheet
        .getRange(existingRowIndex, 1, 1, linhaParaAtualizar.length)
        .setValues([linhaParaAtualizar])
      Logger.log(
        'Avaliação ATUALIZADA para filme ' +
          idFilme +
          ' pelo jurado ' +
          idJurado +
          ' na linha ' +
          existingRowIndex,
      )
    } else {
      // CRIAÇÃO: Gera um novo ID de avaliação
      rowData.id_avaliacao = Utilities.getUuid()

      var linhaParaAdicionar = cabecalhoAvaliacao.map(function (col) {
        return rowData[col] || ''
      })
      sheet.appendRow(linhaParaAdicionar)
      Logger.log('Nova avaliação SALVA para filme ' + idFilme + ' pelo jurado ' + idJurado)
    }

    return { success: true, message: 'Avaliação salva com sucesso.' }
  } catch (e) {
    Logger.log('!! ERRO CRÍTICO em saveAvaliacao: ' + e.message + '\nStack: ' + e.stack)
    return { success: false, message: 'Erro ao salvar a avaliação: ' + e.message }
  }
}
