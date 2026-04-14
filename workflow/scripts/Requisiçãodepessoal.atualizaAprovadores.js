function atualizaAprovadores() {
  var listAprovadores = hAPI.getCardValue('listAprovadores').split(',')
  log.info('>>> atualizaAprovadores > listAprovadores > ')
  log.dir(listAprovadores)
  var listAprovadoresAtual = []

  for (var index = 0; index < listAprovadores.length; index++) {
    var item = listAprovadores[index];

    if (index == 0) {
      hAPI.setCardValue('aprovador', item)
    }
    else {
      listAprovadoresAtual.push(item)
    }
  }
  hAPI.setCardValue('listAprovadores', listAprovadoresAtual.join())
  var hasAprovadores = listAprovadores.length > 0
  log.info('>>> atualizaAprovadores > return > ' + hasAprovadores)
  return hasAprovadores
}