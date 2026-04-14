function beforeStateEntry(sequenceId){

    log.info("@@ Documentos Inteligentes by Digte - Inicio | beforeStateEntry");

    var dgf_cod_etapa = hAPI.getCardValue("dgf_cod_etapa");  
    var dgf_cod_jornada = hAPI.getCardValue("dgf_cod_jornada");
    var WKNumProces = getValue("WKNumProces");
    var iAtivEntrada = sequenceId;
	var iAtivSaida = getValue("WKNumState");

    if (iAtivEntrada != 0 && iAtivEntrada != 4) /* diferente de Início */
    {
        var constraint = [];

        constraint = retornarTodasInformacoesBPM(constraint,WKNumProces);
    
        constraint.push(DatasetFactory.createConstraint("iAtivEntrada", iAtivEntrada, "", ConstraintType.MUST));
        constraint.push(DatasetFactory.createConstraint("iAtivSaida", iAtivSaida, "", ConstraintType.MUST));
        constraint.push(DatasetFactory.createConstraint("WKNumProces", WKNumProces, WKNumProces, ConstraintType.MUST));
        constraint.push(DatasetFactory.createConstraint("event", "beforeStateEntry", "", ConstraintType.MUST));

        log.info("@@ Documentos Inteligentes by Digte - beforeStateEntry - $$$$$$$$$$ Enviando dados para dataset ds_dpf_di_api_execute_event_bpm $$$$$$$$$$");

        var dataset = DatasetFactory.getDataset("ds_dpf_di_api_execute_event_bpm", null, constraint, null);

        log.info("@@ Documentos Inteligentes by Digte - beforeStateEntry - $$$$$$$$$$ Retorno dados da dataset ds_dpf_di_api_execute_event_bpm $$$$$$$$$$");

        log.dir(dataset);

        log.info("@@ Documentos Inteligentes by Digte - beforeStateEntry - $$$$$$$$$$ Retorno dados da dataset ds_dpf_di_api_execute_event_bpm $$$$$$$$$$");

        if(dataset != null){
            for(var i = 0; i < dataset.rowsCount; i++){

                var nomeCampo = dataset.getValue(i,"nomeCampo");
                var valorCampo = dataset.getValue(i,"valorCampo");

                if(nomeCampo != "error") {

                    if(nomeCampo == "addAttachment"){

                        try {
                            var docId = parseInt(valorCampo);
                            hAPI.attachDocument(docId);
                        } catch(e){
                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - addAttachment attachDocument - " + e.message);
                            log.dir(e);
                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - addAttachment attachDocument - " + e.message);
                        }    

                    }
                    else 
                    if(nomeCampo == "removeAttachment"){

                        try {
                            var docId = parseInt(valorCampo);
                            hAPI.attachDocument(docId);

                            fluigAPI.getDocumentService().deleteDocument(docId);

                        } catch(e){
                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - removeAttachment attachDocument - " + e.message);
                            log.dir(e);
                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - removeAttachment  attachDocument - " + e.message);
                        }    

                    }
                    else{

                        try {

                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Gravando Valores no Form - ");

                            log.dir(nomeCampo);
                            log.dir(valorCampo);

                            hAPI.setCardValue(nomeCampo, valorCampo);

                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Gravando Valores no Form - ");

                        } catch(e){
                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - setCardValue - " + e.message);
                            log.dir(e);
                            log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - setCardValue - " + e.message);
                        };    

                    }
                }
                else {

                    log.info("@@ Documentos Inteligentes by Digte -  beforeStateEntry - Erro - retorno dataset - ds_dpf_di_api_execute_event_bpm : " + valorCampo);

                    throw "Erro ao movimentar a solicitação: "+valorCampo;
                }
            }
        }

        hAPI.setCardValue("dgf_nr_processo_bpm", WKNumProces);

    }
    
    log.info("@@ Documentos Inteligentes by Digte - Fim | beforeStateEntry");

}

function retornarTodasInformacoesBPM(constraintParam,WKNumProces){

    var jSonDados = {};

    try{
        var tableId = "principal";
        jSonDados[tableId] = hAPI.getCardData(WKNumProces);
    }catch(e){}    

    try{
        var tableId = "listAttachments";
        jSonDados[tableId] = hAPI.listAttachments();
    }catch(e){}

    /* tabelas pai e filho */
    var sTableId = hAPI.getCardValue("dgf_tabelas_formulario");

    var arrayTableId =  sTableId != "" && sTableId != null ? sTableId.split(",") : ["tbDependente","tbValeTranporte","tbTomador","tbEvento","tbRateioCentroCusto","tbCamposAdicional","tbValorAssociado"]; 
    
    for (var aa = 0; aa < arrayTableId.length; aa++){
        try{
            var tableId = arrayTableId[aa];
            jSonDados[tableId] = hAPI.getChildrenFromTable(tableId);
        }catch(e){}
    }

    constraintParam.push(DatasetFactory.createConstraint("bpmData", JSONUtil.toJSON(jSonDados), "", ConstraintType.MUST));

    return constraintParam;

}