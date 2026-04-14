function createDataset(fields, constraints, sortFields) {

    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/FluigDS";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    
    var myQuery = "SELECT DISTINCT " +
"    PWS.NUM_PROCES AS idFluig, " +
"    PWS.START_DATE AS dataInicio, " +

"    PWS.COD_DEF_PROCES AS COD_DEF_PROCES, " +
"    FORM.cargo AS cargo, " + 
  "    FORM.documentid AS documentid, " + 
"    FORM.candidato AS candidato, " + 
"    FORM.responsavelAprovLideranca AS responsavelAprovLideranca, " + 


"    CASE  " +
" WHEN PWS.STATUS = 0 THEN 'Em Andamento' " +
" WHEN PWS.STATUS = 1 THEN 'Cancelado' " +
" WHEN PWS.STATUS = 2 THEN 'Encerrado' " +
" END situacao, " +
"    ( " +
"        SELECT TOP 1 CONCAT(HP.NUM_SEQ_ESTADO,' - ',EP.DES_ESTADO) " +
"        FROM HISTOR_PROCES HP " +
"        INNER JOIN ESTADO_PROCES EP  " +
"            ON EP.NUM_SEQ = HP.NUM_SEQ_ESTADO " +
"        WHERE HP.NUM_PROCES = PWS.NUM_PROCES   " +
"        AND EP.COD_DEF_PROCES = PWS.COD_DEF_PROCES   " +
"        AND EP.NUM_VERS = PWS.NUM_VERS   " +
"        AND HP.LOG_ATIV = 1   " +
"    ) AS estadoProcesso, " +
"    ( " +
"        SELECT TOP 1 TAR.CD_MATRICULA  " +
"       FROM TAR_PROCES TAR     " +
"       INNER JOIN HISTOR_PROCES HP    " +
"           ON HP.NUM_PROCES = TAR.NUM_PROCES    " +
"       WHERE HP.NUM_PROCES = PWS.NUM_PROCES    " +
"       AND TAR.NUM_SEQ_MOVTO = HP.NUM_SEQ_MOVTO  " +
"       AND HP.LOG_ATIV = 1 " +
"        ORDER BY TAR.NUM_SEQ_MOVTO DESC " +
"    ) AS responsavel, " + 


"(" +
"   	SELECT FULL_NAME " +
"   	FROM FDN_USER FU " +
"   	INNER JOIN FDN_USERTENANT ON FDN_USERTENANT.USER_ID = FU.USER_ID " +
"   	WHERE FDN_USERTENANT.USER_CODE = PWS.COD_MATR_REQUISIT " +
"   ) AS solicitante " +

"FROM ML001309 FORM " +
"INNER JOIN DOCUMENTO DOC  " +
"    ON DOC.NR_DOCUMENTO = FORM.DOCUMENTID  " +
"    AND DOC.COD_REG_LISTA = FORM.ID " +
"INNER JOIN PROCES_WORKFLOW PWS  " +
"    ON PWS.NR_DOCUMENTO_CARD = FORM.DOCUMENTID " +
"WHERE DOC.VERSAO_ATIVA = 1 " 


    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(myQuery);
        var columnCount = rs.getMetaData().getColumnCount();
        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = obj.toString();
                } else {
                    Arr[i - 1] = "";
                }
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO dsConsultaContratos_SQLServer ==============> " + e.message);
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return newDataset;
}
