function afterProcessCreate(processId) {
	var WKNumProces = getValue("WKNumProces");
	var WKNumState = getValue("WKNumState");
	var WKNextState = getValue('WKNextState');
	var completTask = getValue("WKCompletTask");
	log.info('>>> afterProcessCreate > ' + WKNumProces)
	log.info('>>> afterProcessCreate > WKNumState > ' + WKNumState)
	log.info('>>> afterProcessCreate > WKNextState > ' + WKNextState)
	hAPI.setCardValue("numSolic", WKNumProces)
}