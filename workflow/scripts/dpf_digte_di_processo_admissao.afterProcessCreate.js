function afterProcessCreate(processId){
	var nome = hAPI.getCardValue("dgf_nome_completo");
	var cpf = hAPI.getCardValue("dgf_cpf");
	var WKNumProces = getValue("WKNumProces");
	var dgf_cod_requsiticao_folha = getValue("dgf_num_requisicao");
	var dgf_cod_requsiticao_ats = getValue("dgf_num_requisicao_ats");
	var dgf_dt_admissao = hAPI.getCardValue("dgf_dt_admissao");

	//Busca data Atual
	var fullDate     =     new Date();
	var date         =     fullDate.getDate().toString();
	if(date.length == 1) { date = 0+date; }
	var mes         =     (fullDate.getMonth()+1).toString();
	if(mes.length == 1) { mes = 0+mes; }
	var data         =     date+"/"+mes+"/"+fullDate.getFullYear();
	//Busca hora Atual
	var h             =    fullDate.getHours();
	if (h < 10) {h= "0" + h;}
	var m             =    fullDate.getMinutes();
	if (m < 10) {m= "0" + m;}
	var s             =    fullDate.getSeconds();
	if (s < 10) {s= "0" + s;}
	var hora         =     h + ":" + m + ":" + s;

	dgf_dt_admissao = dgf_dt_admissao == null ? "" : dgf_dt_admissao;

	var dgf_campo_descritor = nome +" | "+cpf + " | Dt Ad: "+dgf_dt_admissao + " | Dt Mv: " + data + "-" + hora + " | Nr Sol Ad: " + WKNumProces;
	if (dgf_cod_requsiticao_folha != null){
		dgf_campo_descritor =  dgf_campo_descritor + " | Req FOLHA: " + dgf_cod_requsiticao_folha;
	}
	if (dgf_cod_requsiticao_ats != null){
		dgf_campo_descritor =  dgf_campo_descritor + " | Req ATS: " + dgf_cod_requsiticao_ats;
	}

	hAPI.setCardValue("dgf_campo_descritor",dgf_campo_descritor);
	hAPI.setCardValue("dgf_nr_processo_bpm",WKNumProces);

}