function validaRecrutamento() {
  log.info('>>> validaRecrutamento > ')
	var solic = hAPI.getCardValue("numSolic")
	var ds = DatasetFactory.getDataset(
		"DSform_recrutamento_selecao",
		null,
		[
			DatasetFactory.createConstraint("numProcessoReqPessoal", solic, solic, ConstraintType.MUST),
		],
		null
	);
	ds = tools.datasetToJson(ds)
	var emAndamento = ds.filter(function (item) { return item.aprovado == "" })
	var reprovado = ds.filter(function (item) { return item.aprovado == "false" })
	var aprovado = ds.filter(function (item) { return item.aprovado == "true" })
	var devolverParaDivulgacao = hAPI.getCardValue("devolverParaDivulgacao")
	log.info('>>> validaRecrutamento > devolverParaDivulgacao > ' + hAPI.getCardValue("devolverParaDivulgacao"))
	var indexes = hAPI.getChildrenIndexes("tabelaRecrutamento");
	log.info('>>> validaRecrutamento > emAndamento >')
	log.dir(emAndamento)
	log.info('>>> validaRecrutamento > reprovado >')
	log.dir(reprovado)
	log.info('>>> validaRecrutamento > aprovado >')
	log.dir(aprovado)

	if (indexes.length == aprovado.length && indexes.length < hAPI.getCardValue('numVagas')) {
		log.info('>>> validaRecrutamento > CONDICAO1 >')
		hAPI.setCardValue("devolverParaDivulgacao", true)
	}
	else if (aprovado.length == hAPI.getCardValue('numVagas')) {
		log.info('>>> validaRecrutamento > CONDICAO1 >')
		hAPI.setCardValue("devolverParaDivulgacao", '')
	}
	else if (reprovado.length > 0) {
		log.info('>>> validaRecrutamento > CONDICAO3 >')

		if (devolverParaDivulgacao == 'false') {
			log.info('>>> validaRecrutamento > CONDICAO3.1 >')
			var status = devolverParaDivulgacao
			log.info('>>> reprovado > ')
      var index = 1

			for (var i = 0; i < indexes.length; i++) {
				log.info('>>> indexes > ' + index)
				var statusIndex = hAPI.getCardValue('status___' + index)
				var solicRecrutamento = hAPI.getCardValue('solicRecrutamento___' + index)
				log.info('>>> solicRecrutamento > ' + solicRecrutamento)
				log.info('>>> status___ > ' + statusIndex)
				var hasReprovado = reprovado.filter(function (item) { return item.numSolic == solicRecrutamento }).length > 0

				if (hasReprovado) {
					log.info('>>> hasReprovado > ' + hasReprovado)

					if (statusIndex == "false") {
						log.info('>>> statusIndex > ' + statusIndex)
						status = true
						hAPI.setCardValue('status___' + index, status)
						log.info('>>> atualizado > ' + hAPI.getCardValue('status___' + index))
					}
				}
				index++
			}
			hAPI.setCardValue("devolverParaDivulgacao", status)
		}
	}
	else {
		log.info('>>> validaRecrutamento > CONDICAO4 >')
		hAPI.setCardValue("devolverParaDivulgacao", false)
	}
	log.info('>>> validaRecrutamento > devolverParaDivulgacao > ' + hAPI.getCardValue("devolverParaDivulgacao"))
}