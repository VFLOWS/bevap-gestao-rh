function servicetask71(attempt, message) {

    var users = new java.util.ArrayList();

    users.add("Pool:Role:papelUser");

    var formData = new java.util.HashMap();

    formData.put("numSolicPai", hAPI.getCardValue('numSolicitacao'));
    formData.put("origemRecSelecao", hAPI.getCardValue('origem'));
    formData.put("nomeCandidatoEscolhido", hAPI.getCardValue('candidato'));
    

    var start = hAPI.startProcess("requisicaoPessoal2", 0, users, "Solicitação inicializada através do processo de Recrutamento e seleção", false, formData, false);

    hAPI.setCardValue('linkReqPessoal2', 'https://fluigqa.bevap.com.br:8443/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID='+start.get('iProcess'))


}