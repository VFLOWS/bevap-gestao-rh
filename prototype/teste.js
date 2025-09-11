const API_TOTVS_RM  = $call.environmentVariables.get("ambiente");
const AUTHORIZATION = $call.contextVariables.get("originalAuth");
const DEFAULT_HEADERS = {
    "Authorization": AUTHORIZATION    
}

try {
    const body = JSON.parse($call.request.getBody().getString("utf-8"));
    $call.tracer.trace("bodyRequest: "+ body);

    const codColigada = getColigada(body.idReserva)
    const numVenda = $call.pathParam.get('id');
    $call.tracer.trace("numVenda: "+ numVenda);

    DEFAULT_HEADERS.codColigada = codColigada
    const idCompradorTitular = getCompradorTitular(DEFAULT_HEADERS, numVenda, codColigada);
    $call.tracer.trace("idCompradorTitular: "+idCompradorTitular);

    const dataBase = $request.getHeader("dataBase");
    $call.tracer.trace("dataBase: "+ dataBase);

    var headers = {
        dataBase: dataBase,
        idCompradorTitular: idCompradorTitular,
        codColigada: codColigada
    };
    
    $call.tracer.trace("headers: "+ headers);

    var components = processComponents(body, headers, numVenda, codColigada);
    $call.tracer.trace("components: "+ components);

    var xml = 
        "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:tot=\"http://www.totvs.com/\">" +
            "<soapenv:Header/>" +
            "<soapenv:Body>" +
                "<tot:SaveRecord>" +
                    "<!--Optional:-->" +
                    "<tot:DataServerName>ImbVendaContratoRegraData</tot:DataServerName>" +
                    "<!--Optional:-->" +
                    "<tot:XML><![CDATA[<NewDataSet>" +
                        components.join('') +
                    "</NewDataSet>]]></tot:XML>" +
                    "<!--Optional:-->" +
                    "<tot:Contexto>CODSISTEMA=G;CODCOLIGADA="+codColigada+";CODUSUARIO=mestre</tot:Contexto>" +
                "</tot:SaveRecord>" +
            "</soapenv:Body>" +
        "</soapenv:Envelope>";


    $call.request.getBody().setString(xml, "UTF-8");
    $call.tracer.trace("xml",xml);
    $request.setHeader("content-type", "text/xml; charset=utf-8");
} catch (e) {
  $call.tracer.trace(e);
  throw e;
}

function getCompradorTitular(headers, numVenda) {
    var strUrl = API_TOTVS_RM + "/internal-integration-routes/v1/vendas/" + numVenda + "/titular";
    $call.tracer.trace('strUrl: '+strUrl)
    var body = $http.get(strUrl, headers);
    var parsedResponse = JSON.parse(body.responseText);
    $call.tracer.trace('body.responseText: '+body.responseText)
    var compradores = parsedResponse.readViewResponse.readViewResult.newDataSet.xCompradores;
    
    return compradores[0].idComprador;
}

function processComponents(body, headers, numVenda) {
    const conditions = body.condicao;
    conditions = agruparSeries(conditions);
    let processedComponents = [];
    
    var hasJuros = false;
    var hasCorrecao = false;
    for (let i = 0; i < conditions.length; i++) {
        var condition = conditions[i];
        
        $call.tracer.trace(condition);
        
        $call.tracer.trace("Processando condição de pagamento do tipo serie: " + condition.serie);
        
        if( condition.idSerie == "64" || condition.idSerie == 64){
            continue;
        }
        
/**
 * SEQUENCIA DE CODGRUPO:
 * - TIPO 'SINAL' É O PRIMEIRO E SUBSEQUENTEMENTE ATÉ NÃO TER MAIS DESTE TIPO 
 * - SINAL 1....4
 * - 4 FIXO | ONDE É 1
 * - 5 FIXO | ONDE É 2
 */

        var dynamicFieldsDTO = createDynamicFieldsDTO(condition);
		processedComponents.push(createParcelaGeneralComponent(condition, headers, dynamicFieldsDTO, numVenda, codColigada));
        
        if (verifyIsJurosComponent(condition))
            processedComponents.push(createJurosComponent(condition, headers, dynamicFieldsDTO, numVenda, codColigada));
        
        if (verifyIsCorrecaoMonetariaComponent(condition))
            processedComponents.push(createCorrecaoMonetariaComponent(condition, headers, dynamicFieldsDTO, numVenda, codColigada));
    }
    
    return processedComponents;
}

function agruparSeries(jsonData) {

    var condicoes = jsonData

    // Ordena por dataCadastro para manter a sequência original
    //condicoes.sort((a, b) => new Date(a.dataCadastro) - new Date(b.dataCadastro));

    var sequencia = 1;
    var ultimaSequenciaSinal = null;
    var mapaJurosIndexador = {}

    for (var i = 0; i < condicoes.length; i++) {
        var item = condicoes[i];
        if (item.idSerieInt != null && item.idSerieInt != 'null') {
            if ( (item.idSerieInt == "42")  || (item.idSerieInt == "1")      || (item.idSerieInt == "22") || 
                 (item.idSerieInt == "8")   || (item.idSerieInt == "10")     || (item.idSerieInt == "30") ||
                 (item.idSerieInt == "2")   || (item.idSerieInt == "15")     || (item.idSerieInt == "16") || 
                 (item.idSerieInt == "31")  || (item.idSerieInt == "28")     || (item.idSerieInt == "29") || 
                 (item.idSerieInt == "501")) {
                item.sequenciaAgrupadora = sequencia;
                ultimaSequenciaSinal = sequencia;
                sequencia++; // Incrementa para o próximo "Sinal"
            } else {        
                var chave = item.tipoJuros + "-" + (item.indexador ? item.indexador : "null");
                if (!mapaJurosIndexador[chave]) {
                    mapaJurosIndexador[chave] = ultimaSequenciaSinal !== null ? ultimaSequenciaSinal + 1 : sequencia;
                    sequencia++;
                }
                item.sequenciaAgrupadora = mapaJurosIndexador[chave];                
            }        

        }

    }

    return jsonData;

}

function verifyIsJurosComponent(condition) {
    const totalValue = condition.valorTotal;
    const totalValueWithFees = condition.valorTotalComJuros;
    return totalValue != totalValueWithFees;
}

function createJurosComponent(condition, headers, dynamicFieldsDTO, numVenda, codColigada) {
    $call.tracer.trace("Processando condicao de pagamento do tipo JUROS");
    
    const percentage = getJurosCompostos(condition.valorTotalComJuros, condition.valorTotal, condition.quantidadeParcelas); //((condition.valorTotalComJuros - condition.valorTotal) / condition.valorTotal) * 100;

    return "<XREGRACOMPONENTEVENDA>" +
                "<CODCOLIGADA>"+codColigada+"</CODCOLIGADA>" +
                "<NUM_VENDA>"+ numVenda + "</NUM_VENDA>" +
                "<COD_GRUPO>"+ dynamicFieldsDTO.codGroup + "</COD_GRUPO>" +
                // "<COD_COMPN>32</COD_COMPN>" +
                "<COD_COMPN>3</COD_COMPN>" +
                "<QTD_CAREN>1</QTD_CAREN>" + 
                "<COD_SIT_OPRL>A</COD_SIT_OPRL>" + 
                "<VR_TX_PER>0,64</VR_TX_PER>" + /*REVISION PASSADA => formatarNumero(percentage)*/
                "<CONTROLA_SALDO>N</CONTROLA_SALDO>" + 
                "<DATA_BASE>" + headers.dataBase + "</DATA_BASE>" + 
                "<COD_GRUPO_REF>658</COD_GRUPO_REF>" + 
                "<TIPOPARCELACORRECAO>2</TIPOPARCELACORRECAO>" + 
                "<TIPODATABASE>5</TIPODATABASE>" + 
                "<ACAOREAJUSTE>1</ACAOREAJUSTE>" + 
                "<APOSJUROS>0</APOSJUROS>" + 
                "<DIAVCTORESIDUO>30</DIAVCTORESIDUO>" + 
                "<DTREFENTREGAEMPR>0</DTREFENTREGAEMPR>" + 
                "<COD_TIPO_MOEDA>0</COD_TIPO_MOEDA>" +
                "<PRORATADIA>0</PRORATADIA>" + 
                "<ORIGEMREGRA>1</ORIGEMREGRA>" + 
                "<CODTIPOJUROS>200</CODTIPOJUROS>" + 
                "<TIPOJUROSDIA>0</TIPOJUROSDIA>" + 
                "<FORMULAPRIORIDADE>0</FORMULAPRIORIDADE>" + 
                "<VALORCOMISSAOCLIENTE>" + formatarNumero(0.0) + "</VALORCOMISSAOCLIENTE>" + 
            "</XREGRACOMPONENTEVENDA>";
}

function getJurosCompostos(valorTotalComJuros, valorTotal, parcelas) {
    var taxaJurosCompostos = Math.pow(valorTotalComJuros / valorTotal, 1 / parcelas) - 1;
    taxaJurosCompostos *= 100; // Converte para porcentagem

    return taxaJurosCompostos;
}

function verifyIsCorrecaoMonetariaComponent(condition) {
    return condition.indexador != null && condition.indexador != undefined;
}

function createCorrecaoMonetariaComponent(condition, headers, dynamicFieldsDTO, numVenda, codColigada) {
    $call.tracer.trace("Processando condição de pagamento do tipo CORREÇÃO MONETÁRIA");
    
    return "<XREGRACOMPONENTEVENDA>" +
                "<CODCOLIGADA>"+codColigada+"</CODCOLIGADA>" +
                "<NUM_VENDA>" + numVenda + "</NUM_VENDA>" +
                "<COD_GRUPO>" + dynamicFieldsDTO.codGroup + "</COD_GRUPO>" +
                "<COD_COMPN>4</COD_COMPN>" +
                "<QTD_CAREN>1</QTD_CAREN>" +
                "<COD_SIT_OPRL>A</COD_SIT_OPRL>" +
                "<VR_TX_PER>0</VR_TX_PER>" +
                "<SIMBOLO>" + condition.indexador + "</SIMBOLO>" +
                "<VR_COEFICIENTE>0,0000</VR_COEFICIENTE>" +
                "<NUM_MESES_DEFASAGEM>2</NUM_MESES_DEFASAGEM>" +
                "<CONTROLA_SALDO>S</CONTROLA_SALDO>" +
                "<VR_PARTE_COMPN>0,0000</VR_PARTE_COMPN>" +
                "<DATA_BASE>" + headers.dataBase + "</DATA_BASE>" +
                "<TIPOPARCELACORRECAO>2</TIPOPARCELACORRECAO>" +
                "<TIPODATABASE>5</TIPODATABASE>" +
                "<ACUMULADO>1</ACUMULADO>" +
                "<ACAOREAJUSTE>0</ACAOREAJUSTE>" +
                "<ACUMULADOPRAZO>0</ACUMULADOPRAZO>" +
                "<APOSJUROS>0</APOSJUROS>" +
                "<VRUNTPARCELA>0,0000</VRUNTPARCELA>" +
                "<DIAVCTORESIDUO>" + headers.dataBase.substr(-2) + "</DIAVCTORESIDUO>" +
                "<DTREFENTREGAEMPR>0</DTREFENTREGAEMPR>" +
                "<CODFILIAL>0</CODFILIAL>" +
                "<COD_TIPO_MOEDA>1</COD_TIPO_MOEDA>" +
                "<PRORATADIA>0</PRORATADIA>" +
                "<IGNORARDEFLACAO>1</IGNORARDEFLACAO>" +
                "<APLICARCOEFICIENTEMENSAL>0</APLICARCOEFICIENTEMENSAL>" +
                "<PERCENTJUROSMORA>0,0000</PERCENTJUROSMORA>" +
                "<PERCENTMULTATRASO>0,0000</PERCENTMULTATRASO>" +
                "<CODCOLCXA>0</CODCOLCXA>" +
                "<VALORMULTA>0,0000</VALORMULTA>" +
                "<VALORJUROS>0,0000</VALORJUROS>" +
                "<ORIGEMREGRA>0</ORIGEMREGRA>" +
                "<TIPOJUROSDIA>0</TIPOJUROSDIA>" +
                "<FORMULAPRIORIDADE>0</FORMULAPRIORIDADE>" +
                "<CARENCIAMULTA>1</CARENCIAMULTA>" +
                "<VALORCOMISSAOCLIENTE>0,0000</VALORCOMISSAOCLIENTE>" +
            "</XREGRACOMPONENTEVENDA>"+
            "<XREGRACOMPONENTEVENDA>" +
                "<CODCOLIGADA>"+codColigada+"</CODCOLIGADA>" +
                "<NUM_VENDA>" + numVenda + "</NUM_VENDA>" +
                "<COD_GRUPO>" + dynamicFieldsDTO.codGroup + "</COD_GRUPO>" +
                "<COD_COMPN>11</COD_COMPN>" +
                "<QTD_CAREN>1</QTD_CAREN>" +
                "<COD_SIT_OPRL>A</COD_SIT_OPRL>" +
                "<VR_TX_PER>0</VR_TX_PER>" +
                "<SIMBOLO>" + condition.indexador + "</SIMBOLO>" +
                "<VR_COEFICIENTE>0,0000</VR_COEFICIENTE>" +
                "<NUM_MESES_DEFASAGEM>2</NUM_MESES_DEFASAGEM>" +
                "<CONTROLA_SALDO>S</CONTROLA_SALDO>" +
                "<VR_PARTE_COMPN>0,0000</VR_PARTE_COMPN>" +
                "<DATA_BASE>" + headers.dataBase + "</DATA_BASE>" +
                "<TIPOPARCELACORRECAO>2</TIPOPARCELACORRECAO>" +
                "<TIPODATABASE>5</TIPODATABASE>" +
                "<ACUMULADO>1</ACUMULADO>" +
                "<ACAOREAJUSTE>0</ACAOREAJUSTE>" +
                "<ACUMULADOPRAZO>0</ACUMULADOPRAZO>" +
                "<APOSJUROS>0</APOSJUROS>" +
                "<VRUNTPARCELA>0,0000</VRUNTPARCELA>" +
                "<DIAVCTORESIDUO>" + headers.dataBase.substr(-2) + "</DIAVCTORESIDUO>" +
                "<DTREFENTREGAEMPR>0</DTREFENTREGAEMPR>" +
                "<CODFILIAL>0</CODFILIAL>" +
                "<COD_TIPO_MOEDA>1</COD_TIPO_MOEDA>" +
                "<PRORATADIA>0</PRORATADIA>" +
                "<IGNORARDEFLACAO>1</IGNORARDEFLACAO>" +
                "<APLICARCOEFICIENTEMENSAL>0</APLICARCOEFICIENTEMENSAL>" +
                "<PERCENTJUROSMORA>0,0000</PERCENTJUROSMORA>" +
                "<PERCENTMULTATRASO>0,0000</PERCENTMULTATRASO>" +
                "<CODCOLCXA>0</CODCOLCXA>" +
                "<VALORMULTA>0,0000</VALORMULTA>" +
                "<VALORJUROS>0,0000</VALORJUROS>" +
                "<ORIGEMREGRA>0</ORIGEMREGRA>" +
                "<TIPOJUROSDIA>0</TIPOJUROSDIA>" +
                "<FORMULAPRIORIDADE>0</FORMULAPRIORIDADE>" +
                "<CARENCIAMULTA>1</CARENCIAMULTA>" +
                "<VALORCOMISSAOCLIENTE>0,0000</VALORCOMISSAOCLIENTE>" +
            "</XREGRACOMPONENTEVENDA>";
}

function createParcelaGeneralComponent(condition, headers, dynamicFieldsDTO, numVenda, codColigada) {
    $call.tracer.trace("Processando condicao de pagamento do tipo " + condition.serie);
    
    if (codColigada=='5'||codColigada==5) {
        var codCCusto = '01.01.001'
        var codNatFinanceiraPag = '02.01.002.032'
        var codNatFinanceiraRec = '01.01.001.002'
    } else {
        if (codColigada=='20'||codColigada==20) {
            var codCCusto = '01.01.001'
            var codNatFinanceiraPag = '01.01.001.005'
            var codNatFinanceiraRec = '01.01.001.001'            
        }        
    }
    
    return "<XREGRACOMPONENTEVENDA>" +
        "<CODCOLIGADA>"+codColigada+"</CODCOLIGADA>" +
        "<NUM_VENDA>"+ numVenda + "</NUM_VENDA>" +
        "<COD_GRUPO>"+ dynamicFieldsDTO.codGroup + "</COD_GRUPO>" +
        "<COD_COMPN>"+ condition.idSerieInt + "</COD_COMPN>" +
        "<QTD_PER_PARC>"+calculatePeriodicity(condition.idSerieInt)+"</QTD_PER_PARC>" +
        "<QTD_PARC>" + condition.quantidadeParcelas +"</QTD_PARC>" +
        "<COD_MOD_CALC>"+ dynamicFieldsDTO.codModCalc + "</COD_MOD_CALC>" +
        "<DAT_INI_CALC>" + dynamicFieldsDTO.vencimento + "</DAT_INI_CALC>" +
        "<VR_PARTE_COMPN>" + formatarNumero( dynamicFieldsDTO.valorTotal ) + "</VR_PARTE_COMPN>" +
        "<CODCCUSTO>"+codCCusto+"</CODCCUSTO>" +
        "<COMPOE_SALDO_DEV>S</COMPOE_SALDO_DEV>" +
        "<VRUNTPARCELA>" + formatarNumero( condition.valorTotal / condition.quantidadeParcelas ) + "</VRUNTPARCELA>" +
        "<CODFILIAL>1</CODFILIAL>" +
        "<CODCOLNATFINANCEIRAPAG>"+codColigada+"</CODCOLNATFINANCEIRAPAG>" +
        "<CODNATFINANCEIRAPAG>"+codNatFinanceiraPag+"</CODNATFINANCEIRAPAG>" +
        "<CODCOLNATFINANCEIRAREC>"+codColigada+"</CODCOLNATFINANCEIRAREC>" +
        "<CODNATFINANCEIRAREC>"+codNatFinanceiraRec+"</CODNATFINANCEIRAREC>" +
        "<COD_TIPO_MOEDA>0</COD_TIPO_MOEDA>" +
        "<DATA_EMISSAO>"+ headers.dataBase + "</DATA_EMISSAO>" +
        "<ORIGEMREGRA>0</ORIGEMREGRA>" +
        "<IDCOMPRADOR>" + headers.idCompradorTitular + "</IDCOMPRADOR>" +
        "<TIPOJUROSDIA>0</TIPOJUROSDIA>" +
        "<FORMULAPRIORIDADE>0</FORMULAPRIORIDADE>" +
        "<CARENCIAMULTA>1</CARENCIAMULTA>" +
        "<TOT_PARCELAS>0</TOT_PARCELAS>" +
        "<CODCOLTDOPAG>"+codColigada+"</CODCOLTDOPAG>" +
        "<CODTDOPAG>PDIST</CODTDOPAG>" +
        "<CODCOLTDOREC>"+codColigada+"</CODCOLTDOREC>" +
        "<CODTDOREC>CV</CODTDOREC>" +
        "<VALORCOMISSAOCLIENTE>" + formatarNumero(0.0) + "</VALORCOMISSAOCLIENTE>" +
    "</XREGRACOMPONENTEVENDA>";
}

function calculatePeriodicity(serie){

    var periodicity = 0;

    if(serie == "15" || serie == 15){  //Bimestral
        periodicity = 2;
    } else {
        if(serie == "16" || serie == 16){  //Trimestral
            periodicity = 3;
        } else {
            if(serie == "31" || serie == 31){  //Quadrimestral
                periodicity = 4;
            } else {
                if(serie == "28" || serie == 28){  //Pentamensal
                    periodicity = 5;
                } else {
                    if(serie == "29" || serie == 29){  //Semestral
                        periodicity = 6;
                    } else {
                        if(serie == "30" || serie == 30){  //Anual
                            periodicity = 12;
                        } else {
                            periodicity = 1;
                        }    
                    }    
                }    
            }    
        }    
    }

    $call.tracer.trace("Periodicidade = " + periodicity);
    return periodicity;   

}


function createDynamicFieldsDTO(condition) {
    //const codGroup   = createCodGroup(condition);
    const codGroup   = condition.sequenciaAgrupadora;
    const codModCalc = createCodModCalc(condition);
    const valorTotal = createValorTotal(condition);
    const vencimento = createVencimento(condition);

    return {
        codGroup: codGroup,
        codModCalc: codModCalc,
        valorTotal: valorTotal,
        vencimento: vencimento
    };
}

function createCodGroup(condition) {
    if (condition.tipoJuros == "SJ" && (condition.indexador == null || condition.indexador == undefined)) {
        return 1;
    }
    
    if (condition.tipoJuros == "SJ" && (condition.indexador != null || condition.indexador != undefined)) {
        return 2;
    }

    if (condition.tipoJuros == "TS" && (condition.indexador == null || condition.indexador == undefined)) {
        return 1;
    }

    if (condition.tipoJuros == "TS" && (condition.indexador != null && condition.indexador != undefined)) {
        return 2;
    }

    if (condition.tipoJuros == "TP" && (condition.indexador != null && condition.indexador != undefined)) {
        return 2;
    }
    
    if (condition.tipoJuros == "TP" && (condition.indexador == null && condition.indexador == undefined)) {
        return 2;
    }
}

function createCodModCalc(condition) {
    if (condition.tipoJuros == "TP")
        return 2;

    if (condition.tipoJuros == "TS")
        return 1;
        
    if(condition.serie == "Sinal")
        return "";
    
    return 13;
}

function createValorTotal(condition) {
    // const valorTotalText = String(condition.valorTotal);
    // return Number(valorTotalText.replace(".", ","));
    return condition.valorTotal;
}

function createVencimento(condition) {
    if (condition.parcelas.length > 0) {
        return condition.parcelas[0].vencimento;
    }
}

function formatarNumero(numero) {
  var numeroArredondado = Math.round(numero * 10000) / 10000;
  var numeroString = numeroArredondado.toString();

  var partes = numeroString.split('.');
  partes[1] = partes[1] ? ',' + partes[1] : '';

  return partes.join('');
}

function getColigada(idReserva) {

    var dynamicEnv = String($call.environmentVariables.get("ambiente"));
    var endpointUrl = "/cv-crm/v1/reservas/" + idReserva;
    var fullUrl = dynamicEnv + endpointUrl;
    $call.tracer.trace("Reserva fullUrl: " + fullUrl);
    const DEFAULT_HEADERS = {
        "Authorization": $call.contextVariables.get("originalAuth")
    };

    const responseReturn = $http.get(fullUrl, DEFAULT_HEADERS);
    const parsedResponse = JSON.parse(responseReturn.responseText);
    $call.tracer.trace("Reserva responseReturn.responseText: " + responseReturn.responseText);
    var idEmpreendimento = Array.isArray(parsedResponse[idReserva].unidade) ? parsedResponse[idReserva].unidade[0].idempreendimento_cv : parsedResponse[idReserva].unidade ? parsedResponse[idReserva].unidade.idempreendimento_cv : null;
    $call.tracer.trace("idEmpreendimento: " + idEmpreendimento);
    var codColigada = getCodColigada(idEmpreendimento)

    return codColigada

}

function getCodColigada(idEmpreendimento) {
    var dynamicEnv = String($call.environmentVariables.get("ambiente"));
    var endpointUrl = "/cv-crm/v1/empreendimentos/" + idEmpreendimento;
    var fullUrl = dynamicEnv + endpointUrl;
    $call.tracer.trace("fullUrl: " + fullUrl);
    const DEFAULT_HEADERS = {
        "Authorization": $call.contextVariables.get("originalAuth")
    };

    const codcol = $http.get(fullUrl, DEFAULT_HEADERS);
    const parsedResponse = JSON.parse(codcol.responseText);

    $call.tracer.trace("Chamada funcionou: " + codcol.responseText);

    $call.tracer.trace("getCodColigada", parsedResponse);

    //const codColigada = parsedResponse.idempresa_int || "5";
    const codColigada = parsedResponse.idempresa_int;

    $call.tracer.trace(codColigada);

    return codColigada;
}