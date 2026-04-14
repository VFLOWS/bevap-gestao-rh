function servicetask101(attempt, message) {

    var i = 0;

    var indexes = hAPI.getChildrenIndexes("tabelaRecrutamento");
    var pageService = fluigAPI.getPageService().getServerURL();

    var ident = 0

    for (var i = 0; i < indexes.length; i++) {
        var users = new java.util.ArrayList();
        users.add("Pool:Role:papelUser");

        var formData = new java.util.HashMap();
        
        if (hAPI.getCardValue('solicRecrutamento___' + (i + 1)) == "") {
        	formData.put("infoNome", hAPI.getCardValue('nomeCandidato___' + (i + 1)));
            formData.put("infoCpf", hAPI.getCardValue('cpfCandidato___' + (i + 1)));
            formData.put("infoIdentidade", hAPI.getCardValue('rgCandidato___' + (i + 1)));
            formData.put("infoDtNascimento", hAPI.getCardValue('dataNascimentoCandidato___' + (i + 1)));
            formData.put("infoNaturalidade", hAPI.getCardValue('naturalidadeCandidato___' + (i + 1)));
            formData.put("infoGrauCandidato", hAPI.getCardValue('instrucao___' + (i + 1)));
            formData.put("infoGrauRequisito", hAPI.getCardValue('instrucaoCandidato'));
            
            formData.put("candidato", hAPI.getCardValue('nomeCandidato___' + (i + 1)));
            formData.put("numSolicitacao", hAPI.getCardValue('numSolic'));

            formData.put("numVagas2", hAPI.getCardValue('numVagas'));

            log.info('VAGAS --- >')
            log.dir(hAPI.getCardValue('numVagas'))

            formData.put("solicitante", hAPI.getCardValue('dados_nomeSolicitante'));
            formData.put("dados_matSolicitante", hAPI.getCardValue('dados_matSolicitante'));

            // var WKUserAvaTecnica = hAPI.getCardValue('WKUserSupervisor') || hAPI.getCardValue('WKUserGestor')
            var WKUserAvaTecnica = hAPI.getCardValue('WKUserGestor') || hAPI.getCardValue('WKUserDiretor')
            formData.put("responsavelAprovLideranca", WKUserAvaTecnica);
            formData.put("WKUserAvaTecnica", WKUserAvaTecnica);

            formData.put("cargo", hAPI.getCardValue('cargo'));
            formData.put("tipoVaga", hAPI.getCardValue('tipoVaga'));
            formData.put("origem", hAPI.getCardValue('origemCandidato___' + (i + 1)));
            formData.put("numProcessoReqPessoal", hAPI.getCardValue('numSolic'));
            formData.put("linkSolicitacaoReq",pageService + '/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID='+hAPI.getCardValue('numSolic'));

            var start = hAPI.startProcess("recrutamento_selecao", 79, users, "Solicitação inicializada através do processo de Requisição de Pessoal", true, formData, false);

            log.info('TESTEEE')
            log.dir(start.get('iProcess'))
            hAPI.setCardValue('solicRecrutamento___' + (i + 1), start.get('iProcess'))
            
            
            if(ident == 0){
                log.info('solicitacoesCriadasRecruta ----->')
                log.dir(hAPI.getCardValue('solicitacoesCriadasRecruta'))
                hAPI.setCardValue('solicitacoesCriadasRecruta', start.get('iProcess'))
                ident = 1
            }
            else{
                log.info('solicitacoesCriadasRecruta 2 ----->')
                log.dir(hAPI.getCardValue('solicitacoesCriadasRecruta'))
                hAPI.setCardValue('solicitacoesCriadasRecruta', hAPI.getCardValue('solicitacoesCriadasRecruta') +','+ start.get('iProcess'))
            }
        }
    }
    log.info('>>> servicetask101 > FIM')
    return true
}