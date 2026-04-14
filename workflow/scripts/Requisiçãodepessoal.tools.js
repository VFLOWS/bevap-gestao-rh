

var tools = {
	datasetToJson: function (dataset) {
		var retorno = [];
		for (var i = 0; i < dataset.rowsCount; i++) {
			var obj = {};
			for (var c = 0; c < dataset.columnsName.length; c++) {
				obj[dataset.columnsName[c].toString()] = (dataset.getValue(i, dataset.columnsName[c]) != null ? dataset.getValue(i, dataset.columnsName[c]) : "").toString();
			}
			retorno.push(obj);
		}
		return retorno;
	}
}
