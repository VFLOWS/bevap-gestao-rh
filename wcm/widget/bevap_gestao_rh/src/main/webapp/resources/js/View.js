class View {
    constructor(controller) {
        this.controller = controller;
        this.root = document.getElementById(`MyWidget_${controller.instanceId}`);

        this.suffix = `-${controller.instanceId}`;

        this._visibilityWatchdogTimer = null;

        this._detailBtnDelegationBound = false;

        this._colleagueNameCache = {};

    this._admissaoModalBuilt = false;
    this._admissaoModalFieldEls = null;
    this._admissaoModalChildTables = null;


        this.applyPortalLayoutFixesLikeEmailWidget();

    }

    init() {
        if (!this.root) return;

        try {
            this.ensureVisible();
            this.debugVisibility("init");
        } catch (e) {
            // noop
        }

        this.installVisibilityWatchdog();

        try {
            setTimeout(() => this.debugVisibility("t+500ms"), 500);
            setTimeout(() => this.debugVisibility("t+2000ms"), 2000);
        } catch (e) {
            // noop
        }

        this.setupTableFilter(`filtro-adm${this.suffix}`, `tabela-adm${this.suffix}`);
        this.setupTableFilter(`filtro-req1${this.suffix}`, `tabela-req1${this.suffix}`);
        this.setupTableFilter(`filtro-req2${this.suffix}`, `tabela-req2${this.suffix}`);
        this.setupTableFilter(`filtro-rec1${this.suffix}`, `tabela-rec1${this.suffix}`);
        this.setupTableFilter(`filtro-rec2${this.suffix}`, `tabela-rec2${this.suffix}`);

        this.setupGlobalFilters();

        this.setupPainelCollapse();
        this.setupModalTabs();
        this.setupModalDetails();
        this.setupModalClose();

        this.loadAdmissao();
        this.loadRequisicaoPessoalParte1();
        this.loadRequisicaoPessoalParte2();
        this.loadRecrutamentoSelecaoParte1();
        this.loadRecrutamentoSelecaoParte2();

    }

    _tableNoDataMessage() {
        return "Nenhum dado disponível para ser exibido.";
    }

    _getTableColumnCount(table) {
        try {
            const ths = table ? table.querySelectorAll("thead th") : null;
            if (ths && ths.length) return ths.length;
        } catch (e) {
            // noop
        }
        return 1;
    }

    _getOrCreateEmptyRow(tbody, colCount, message) {
        if (!tbody) return null;

        let emptyRow = null;
        try {
            emptyRow = tbody.querySelector('tr[data-empty-row="1"]');
        } catch (e) {
            emptyRow = null;
        }

        if (!emptyRow) {
            emptyRow = document.createElement("tr");
            emptyRow.setAttribute("data-empty-row", "1");
            emptyRow.className = "rh-empty-row";

            const td = document.createElement("td");
            td.colSpan = Math.max(1, parseInt(colCount, 10) || 1);
            td.className = "text-center";
            td.textContent = this._safeStr(message) || this._tableNoDataMessage();
            emptyRow.appendChild(td);

            tbody.appendChild(emptyRow);
        } else {
            const td = emptyRow.querySelector("td");
            if (td) {
                td.colSpan = Math.max(1, parseInt(colCount, 10) || 1);
                td.textContent = this._safeStr(message) || this._tableNoDataMessage();
            }
        }

        return emptyRow;
    }

    _syncEmptyRowForTable(table, message) {
        if (!table) return;
        const tbody = table.getElementsByTagName("tbody")[0];
        if (!tbody) return;

        let wrap = null;
        try {
            wrap = table.closest ? table.closest(".rh-table-wrap") : null;
        } catch (e) {
            wrap = null;
        }

        if (!wrap) {
            try {
                let p = table.parentNode;
                while (p) {
                    if (p.classList && p.classList.contains("rh-table-wrap")) {
                        wrap = p;
                        break;
                    }
                    p = p.parentNode;
                }
            } catch (e) {
                // noop
            }
        }

        const rows = Array.from(tbody.getElementsByTagName("tr"));
        const dataRows = rows.filter((r) => r && r.getAttribute && r.getAttribute("data-empty-row") !== "1");
        const visibleDataRows = dataRows.filter((r) => (r.style ? r.style.display !== "none" : true));

        if (visibleDataRows.length === 0) {
            const colCount = this._getTableColumnCount(table);
            const emptyRow = this._getOrCreateEmptyRow(tbody, colCount, message);
            if (emptyRow && emptyRow.style) emptyRow.style.display = "";

            try {
                if (wrap && wrap.classList) wrap.classList.add("rh-table-wrap-empty");
            } catch (e) {
                // noop
            }
            return;
        }

        try {
            if (wrap && wrap.classList) wrap.classList.remove("rh-table-wrap-empty");
        } catch (e) {
            // noop
        }

        // Existe pelo menos uma linha visível: remove a linha "sem dados" se estiver lá.
        try {
            const emptyRow = tbody.querySelector('tr[data-empty-row="1"]');
            if (emptyRow && emptyRow.parentNode) emptyRow.parentNode.removeChild(emptyRow);
        } catch (e) {
            // noop
        }
    }

    _setSectionTableEmpty(section, message) {
        const table = section ? Util.q(section, "table.rh-table") : null;
        if (!table) return;

        const tbody = table.getElementsByTagName("tbody")[0];
        if (!tbody) return;

        tbody.innerHTML = "";
        this._syncEmptyRowForTable(table, message);
    }

    loadAdmissao() {
        const section = Util.q(this.root, `#bevap-rh-admissao${this.suffix}`);
        if (!section) return;

        const tbody = Util.q(section, "table.rh-table tbody");
        if (!tbody) return;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            this._retryLater("loadAdmissao", 10, 300);
            return;
        }

        let ds = null;
        try {
            ds = DatasetFactory.getDataset("ds_rastreabilidade_RH_admissao", null, null, null);
        } catch (e) {
            ds = null;
        }

        const acc = this._asDatasetAccessor(ds);
        if (!acc || acc.rowsCount <= 0) {
            try {
                console.warn("[bevap_gestao_rh] ds_rastreabilidade_RH_admissao vazio/indisponível", ds);
            } catch (e) {
                // noop
            }
            this._setSectionTableEmpty(section, this._tableNoDataMessage());
            this.applyGlobalFilters();
            return;
        }

        tbody.innerHTML = "";

        for (let i = 0; i < acc.rowsCount; i += 1) {
            const idFluig = this._valueOrNA(acc.getValue(i, "idFluig"));
            const documentid = this._safeStr(
                acc.getValue(i, "documentid") || acc.getValue(i, "documentId") || acc.getValue(i, "DocumentId")
            );
            const solicitante = this._valueOrNA(
                acc.getValue(i, "dados_nomeSolicitante") || acc.getValue(i, "solicitanteNome")
            );
            const situacao = this._safeStr(acc.getValue(i, "situacao"));
            const localizacao = this._valueOrNA(this._stripLeadingCodeLabel(acc.getValue(i, "estadoProcesso")));
            const nomeCandidato = this._valueOrNA(acc.getValue(i, "pf_nome"));
            const cpf = this._valueOrNA(acc.getValue(i, "pf_cpf"));
            const rawDataInicio =
                acc.getValue(i, "dataInicio") || acc.getValue(i, "pf_dataadmissao") || acc.getValue(i, "data_admissao");
            const dataInicio = this._valueOrNA(this._formatDateBr(this._safeStr(rawDataInicio)));

            const responsavelId = this._safeStr(acc.getValue(i, "responsavel"));
            const responsavelNome = this._valueOrNA(this._getColleagueName(responsavelId));

            const tr = document.createElement("tr");
            tr.className = i % 2 === 0 ? "rh-tr-odd" : "rh-tr-even";

            tr.setAttribute("data-process", "admissao");
            tr.setAttribute("data-status", this._normalizeStr(situacao));
            tr.setAttribute("data-solicitante", this._normalizeStr(solicitante));
            tr.setAttribute("data-date-inicio", this._toIsoDateOnly(rawDataInicio));

            tr.appendChild(this._tdText(idFluig));
            tr.appendChild(this._tdText(solicitante));
            tr.appendChild(this._tdStatusBadge(situacao));
            tr.appendChild(this._tdText(localizacao));
            tr.appendChild(this._tdText(nomeCandidato));
            tr.appendChild(this._tdText(cpf));
            tr.appendChild(this._tdText(dataInicio));
            tr.appendChild(this._tdText(responsavelNome));
            tr.appendChild(
                this._tdDetailButton(idFluig !== "N/A" ? idFluig : String(i + 1), {
                    process: "admissao",
                    documentid,
                })
            );

            tbody.appendChild(tr);
        }

        this.applyGlobalFilters();
    }

    loadRequisicaoPessoalParte1() {
        const section = Util.q(this.root, `#bevap-rh-requisicao${this.suffix}`);
        if (!section) return;

        const tbody = Util.q(section, "table.rh-table tbody");
        if (!tbody) return;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            this._retryLater("loadRequisicaoPessoalParte1", 10, 300);
            return;
        }

        let ds = null;
        try {
            ds = DatasetFactory.getDataset("ds_rastreabilidade_RH_requisicao1", null, null, null);
        } catch (e) {
            ds = null;
        }

        const acc = this._asDatasetAccessor(ds);
        if (!acc || acc.rowsCount <= 0) {
            try {
                console.warn("[bevap_gestao_rh] ds_rastreabilidade_RH_requisicao1 vazio/indisponível", ds);
            } catch (e) {
                // noop
            }
            this._setSectionTableEmpty(section, this._tableNoDataMessage());
            this.applyGlobalFilters();
            return;
        }

        // Se deu certo ler o dataset, substitui o mock.
        tbody.innerHTML = "";

        for (let i = 0; i < acc.rowsCount; i += 1) {
            const idFluig = this._valueOrNA(acc.getValue(i, "idFluig"));
            const documentid = this._safeStr(
                acc.getValue(i, "documentid") || acc.getValue(i, "documentId") || acc.getValue(i, "DocumentId")
            );
            const solicitanteNome = this._valueOrNA(acc.getValue(i, "dados_nomeSolicitante"));
            const situacao = this._safeStr(acc.getValue(i, "situacao"));
            const localizacao = this._valueOrNA(this._stripLeadingCodeLabel(acc.getValue(i, "estadoProcesso")));
            const cargo = this._valueOrNA(acc.getValue(i, "cargo"));
            const departamento = this._valueOrNA(acc.getValue(i, "localTrabalho"));
            const vagas = this._valueOrNA(acc.getValue(i, "numVagas"));
            // Cabeçalho da tabela: "Data Solicitação"
            const rawDataSolicitacao =
                acc.getValue(i, "dados_dataSolicitacao") ||
                acc.getValue(i, "dataSolicitacao") ||
                acc.getValue(i, "data_solicitacao") ||
                acc.getValue(i, "dataEnvio") ||
                acc.getValue(i, "dataInicio");
            const dataSolicitacao = this._valueOrNA(this._formatDateBr(this._safeStr(rawDataSolicitacao)));

            const tr = document.createElement("tr");
            tr.className = i % 2 === 0 ? "rh-tr-odd" : "rh-tr-even";

            tr.setAttribute("data-process", "req1");
            tr.setAttribute("data-status", this._normalizeStr(situacao));
            tr.setAttribute("data-solicitante", this._normalizeStr(solicitanteNome));
            tr.setAttribute("data-date-solicitacao", this._toIsoDateOnly(rawDataSolicitacao));
            tr.setAttribute("data-date-inicio", this._toIsoDateOnly(acc.getValue(i, "dataInicio")));

            tr.appendChild(this._tdText(idFluig));
            tr.appendChild(this._tdText(solicitanteNome));
            tr.appendChild(this._tdStatusBadge(situacao));
            tr.appendChild(this._tdText(localizacao));
            tr.appendChild(this._tdText(cargo));
            tr.appendChild(this._tdText(departamento));
            tr.appendChild(this._tdText(vagas));
            tr.appendChild(this._tdText(dataSolicitacao));
            tr.appendChild(
                this._tdDetailButton(idFluig !== "N/A" ? idFluig : String(i + 1), {
                    process: "req1",
                    documentid,
                })
            );

            tbody.appendChild(tr);
        }

        this.applyGlobalFilters();
    }

    loadRequisicaoPessoalParte2() {
        const section = Util.q(this.root, `#bevap-rh-requisicao2${this.suffix}`);
        if (!section) return;

        const tbody = Util.q(section, "table.rh-table tbody");
        if (!tbody) return;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            this._retryLater("loadRequisicaoPessoalParte2", 10, 300);
            return;
        }

        let ds = null;
        try {
            ds = DatasetFactory.getDataset("ds_rastreabilidade_RH_requisicao2", null, null, null);
        } catch (e) {
            ds = null;
        }

        const acc = this._asDatasetAccessor(ds);
        if (!acc || acc.rowsCount <= 0) {
            try {
                console.warn("[bevap_gestao_rh] ds_rastreabilidade_RH_requisicao2 vazio/indisponível", ds);
            } catch (e) {
                // noop
            }
            this._setSectionTableEmpty(section, this._tableNoDataMessage());
            this.applyGlobalFilters();
            return;
        }

        tbody.innerHTML = "";

        for (let i = 0; i < acc.rowsCount; i += 1) {
            const idFluig = this._valueOrNA(acc.getValue(i, "idFluig"));
            const documentid = this._safeStr(
                acc.getValue(i, "documentid") || acc.getValue(i, "documentId") || acc.getValue(i, "DocumentId")
            );
            const solicitanteNome = this._valueOrNA(acc.getValue(i, "dados_nomeSolicitante"));
            const situacao = this._safeStr(acc.getValue(i, "situacao"));
            const localizacao = this._valueOrNA(this._stripLeadingCodeLabel(acc.getValue(i, "estadoProcesso")));
            const cargo = this._valueOrNA(acc.getValue(i, "cargo"));
            const departamento = this._valueOrNA(acc.getValue(i, "localTrabalho"));
            const vagas = this._valueOrNA(acc.getValue(i, "numVagas"));
            // Cabeçalho da tabela: "Data Solicitação"
            const rawDataSolicitacao =
                acc.getValue(i, "dados_dataSolicitacao") ||
                acc.getValue(i, "dataSolicitacao") ||
                acc.getValue(i, "data_solicitacao") ||
                acc.getValue(i, "dataEnvio") ||
                acc.getValue(i, "dataInicio");
            const dataSolicitacao = this._valueOrNA(this._formatDateBr(this._safeStr(rawDataSolicitacao)));

            const tr = document.createElement("tr");
            tr.className = i % 2 === 0 ? "rh-tr-odd" : "rh-tr-even";

            tr.setAttribute("data-process", "req2");
            tr.setAttribute("data-status", this._normalizeStr(situacao));
            tr.setAttribute("data-solicitante", this._normalizeStr(solicitanteNome));
            tr.setAttribute("data-date-solicitacao", this._toIsoDateOnly(rawDataSolicitacao));
            tr.setAttribute("data-date-inicio", this._toIsoDateOnly(acc.getValue(i, "dataInicio")));

            tr.appendChild(this._tdText(idFluig));
            tr.appendChild(this._tdText(solicitanteNome));
            tr.appendChild(this._tdStatusBadge(situacao));
            tr.appendChild(this._tdText(localizacao));
            tr.appendChild(this._tdText(cargo));
            tr.appendChild(this._tdText(departamento));
            tr.appendChild(this._tdText(vagas));
            tr.appendChild(this._tdText(dataSolicitacao));
            tr.appendChild(
                this._tdDetailButton(idFluig !== "N/A" ? idFluig : String(i + 1), {
                    process: "req2",
                    documentid,
                })
            );

            tbody.appendChild(tr);
        }

        this.applyGlobalFilters();
    }

    _getRequisicao2DetalhamentoConfig() {
        try {
            const cfg = window.BEVAP_RH_REQUISICAO2_DETALHAMENTO_CONFIG;
            if (!cfg || !cfg.panels || !Array.isArray(cfg.panels)) return null;
            return cfg;
        } catch (e) {
            return null;
        }
    }

    _ensureRequisicao2ModalBuilt() {
        if (this._requisicao2ModalBuilt) return true;

        const cfg = this._getRequisicao2DetalhamentoConfig();
        const modal = Util.q(this.root, `#modal-requisicao2${this.suffix}`);
        const tabs = Util.q(this.root, `#modal-requisicao2-tabs${this.suffix}`);
        const body = Util.q(this.root, `#modal-requisicao2-body${this.suffix}`);
        if (!cfg || !modal || !tabs || !body) return false;

        // Reset container (keep close button).
        const closeBtn = Util.q(tabs, `#close-modal-requisicao2${this.suffix}`);
        Util.qa(tabs, ".tab-btn").forEach((b) => b.remove());
        body.innerHTML = "";

        this._requisicao2ModalFieldEls = {};
        this._requisicao2ModalChildTables = {};

        const makeSafeId = (s) => {
            const v = String(s || "");
            const normalized = typeof v.normalize === "function" ? v.normalize("NFD") : v;
            const cleaned = normalized
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();
            return cleaned ? cleaned : "tab";
        };

        cfg.panels.forEach((panel, idx) => {
            const tabKey = `req2-${makeSafeId(panel.domId || panel.title || String(idx))}-${idx}`;

            const btn = document.createElement("button");
            btn.className = "tab-btn" + (idx === 0 ? " tab-active" : "");
            btn.setAttribute("data-tab", tabKey);
            btn.textContent = String(panel.title || `Painel ${idx + 1}`);

            if (closeBtn) tabs.insertBefore(btn, closeBtn);
            else tabs.appendChild(btn);

            const tab = document.createElement("div");
            tab.className = "tab-content" + (idx === 0 ? "" : " hidden");
            tab.id = `tab-${tabKey}${this.suffix}`;

            (panel.sections || []).forEach((section) => {
                if (section.type === "section") {
                    const title = this._safeStr(section.title);
                    if (title) {
                        const h = document.createElement("h2");
                        h.className = "rh-modal-section-title";
                        h.textContent = title;
                        tab.appendChild(h);
                    }

                    const grid = document.createElement("div");
                    grid.className = "rh-modal-grid-2";

                    (section.fields || []).forEach((f) => {
                        const fieldId = this._safeStr(f.id);
                        if (!fieldId) return;

                        const wrap = document.createElement("div");
                        const label = document.createElement("label");
                        label.className = "rh-modal-label";
                        label.textContent = this._safeStr(f.label) || fieldId;

                        const input = document.createElement("input");
                        input.type = "text";
                        input.readOnly = true;
                        input.className = "input-modal";
                        input.setAttribute("data-field-id", fieldId);

                        wrap.appendChild(label);
                        wrap.appendChild(input);
                        grid.appendChild(wrap);

                        this._requisicao2ModalFieldEls[fieldId] = input;
                    });

                    if (grid.childElementCount > 0) tab.appendChild(grid);
                }

                if (section.type === "childTable") {
                    const tableId = this._safeStr(section.tableId);
                    if (!tableId) return;

                    const h = document.createElement("h2");
                    h.className = "rh-modal-section-title";
                    h.textContent = this._safeStr(section.title) || `Tabela Filho: ${tableId}`;
                    tab.appendChild(h);

                    const container = document.createElement("div");
                    container.setAttribute("data-child-table", tableId);
                    tab.appendChild(container);

                    const fields = [];
                    (section.fields || []).forEach((f) => {
                        const key = this._safeStr(f.key);
                        if (!key) return;
                        fields.push({ key, label: this._safeStr(f.label) || key });
                    });

                    this._requisicao2ModalChildTables[tableId] = { container, fields };
                }
            });

            body.appendChild(tab);
        });

        this._setupModalTabs(modal);

        this._requisicao2ModalBuilt = true;
        return true;
    }

    _logRequisicao2Detail(label, payload) {
        try {
            if (payload !== undefined) console.log(`[bevap_gestao_rh][req2] ${label}`, payload);
            else console.log(`[bevap_gestao_rh][req2] ${label}`);
        } catch (e) {
            // noop
        }
    }

    _parseMaybeJsonArrayReq2(value) {
        if (Array.isArray(value)) return value;
        const s = this._safeStr(value);
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            this._logRequisicao2Detail("WARN: JSON inválido em tabela filho", { value: s.slice(0, 200) });
            return [];
        }
    }

    _fetchRequisicao2Detalhamento(documentid) {
        const cfg = this._getRequisicao2DetalhamentoConfig();
        if (!cfg) return null;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            return null;
        }

        const doc = this._safeStr(documentid);
        if (!doc) return null;

        this._logRequisicao2Detail("documentid", doc);
        this._logRequisicao2Detail("selectFields.count", Array.isArray(cfg.selectFields) ? cfg.selectFields.length : 0);

        const constraints = [];
        let canBuildConstraints = false;
        try {
            if (typeof DatasetFactory.createConstraint === "function" && typeof ConstraintType !== "undefined") {
                constraints.push(DatasetFactory.createConstraint("documentid", doc, doc, ConstraintType.MUST));
                const tableName = String(cfg.baseTable);
                constraints.push(DatasetFactory.createConstraint("tablename", tableName, tableName, ConstraintType.MUST));
                canBuildConstraints = true;
            }
        } catch (e) {
            // noop
        }

        if (!canBuildConstraints) {
            this._logRequisicao2Detail(
                "WARN: não foi possível criar constraints (DatasetFactory.createConstraint/ConstraintType)"
            );
        } else {
            this._logRequisicao2Detail("constraints", constraints);
        }

        const datasetName = String(cfg.dataset);
        const callDataset = (fields, label) => {
            let dsLocal = null;
            try {
                const cnt = Array.isArray(fields) ? fields.length : fields == null ? "(null)" : "(?)";
                this._logRequisicao2Detail(`dataset call ${label}.fields.count`, cnt);

                dsLocal = DatasetFactory.getDataset(
                    datasetName,
                    fields == null ? null : fields,
                    canBuildConstraints ? constraints : null,
                    null
                );
            } catch (e) {
                this._logRequisicao2Detail(`ERRO DatasetFactory.getDataset (${label})`, e);
                dsLocal = null;
            }
            return dsLocal;
        };

        const ds = callDataset(cfg.selectFields || null, "full");
        const values = ds && Array.isArray(ds.values) ? ds.values : [];
        this._logRequisicao2Detail("dataset.values.length", values.length);
        if (!ds) {
            this._logRequisicao2Detail("dataset retorno = null");
            return null;
        }
        if (values.length <= 0) {
            this._logRequisicao2Detail("dataset vazio", ds);
            return null;
        }

        let row = values[0] || null;
        if (!canBuildConstraints) {
            const found = values.find((r) => this._safeStr(r && r.documentid) === doc);
            if (found) row = found;
            this._logRequisicao2Detail("row (fallback)", row);
            return row;
        }

        this._logRequisicao2Detail("row (0)", row);
        return row;
    }

    _resolveRequisicao2FieldValue(values, fieldId) {
        const id = this._safeStr(fieldId);
        if (!id) return "";

        // Normal fields: read directly from row.
        if (id.indexOf(".") === -1) return values ? values[id] : "";

        // Fallback: pseudo-fields from child JSON tables.
        const parts = id.split(".");
        const tableId = this._safeStr(parts[0]);
        const lookupKey = parts.slice(1).join(".");
        if (!tableId || !lookupKey) return "";

        const arr = this._parseMaybeJsonArrayReq2(values ? values[tableId] : null);
        if (!arr || arr.length === 0) return "";

        const item = arr.find((it) => it && lookupKey in it);
        return item ? item[lookupKey] : "";
    }

    _fillRequisicao2Modal(row) {
        const modal = Util.q(this.root, `#modal-requisicao2${this.suffix}`);
        if (!modal) return;

        const values = row || {};

        const cfg = this._getRequisicao2DetalhamentoConfig();

        this._logRequisicao2Detail("preenchendo modal com row", values);

        const fieldEls = this._requisicao2ModalFieldEls || {};
        Object.keys(fieldEls).forEach((fieldId) => {
            const el = fieldEls[fieldId];
            if (!el) return;
            const raw = this._resolveRequisicao2FieldValue(values, fieldId);
            const mapped = this._mapSelectValueFromConfig(cfg, fieldId, raw, values);
            const v = this._valueOrNA(mapped);
            el.value = v;
            if (v) el.setAttribute("title", String(v));
            else el.removeAttribute("title");
        });

        const tables = this._requisicao2ModalChildTables || {};
        Object.keys(tables).forEach((tableId) => {
            const def = tables[tableId];
            if (!def || !def.container) return;
            def.container.innerHTML = "";

            const arr = this._parseMaybeJsonArrayReq2(values[tableId]);
            if (!arr || arr.length === 0) {
                const empty = document.createElement("div");
                empty.className = "rh-modal-field";
                empty.textContent = "Nenhum registro";
                def.container.appendChild(empty);
                return;
            }

            arr.forEach((item, idx) => {
                const record = document.createElement("div");
                record.className = "rh-modal-record";

                const recordTitle = document.createElement("label");
                recordTitle.className = "rh-modal-label-bold";
                recordTitle.textContent = `Registro ${idx + 1}`;
                record.appendChild(recordTitle);

                const grid = document.createElement("div");
                grid.className = "rh-modal-grid-2";

                (def.fields || []).forEach((col) => {
                    const wrap = document.createElement("div");
                    const label = document.createElement("label");
                    label.className = "rh-modal-label";
                    label.textContent = this._safeStr(col.label) || this._safeStr(col.key);

                    const input = document.createElement("input");
                    input.type = "text";
                    input.readOnly = true;
                    input.className = "input-modal";

                    const cell = item && col && col.key in item ? item[col.key] : "";
                    const mappedCell = this._mapSelectValueFromConfig(cfg, col.key, cell, item);
                    const txt = this._valueOrNA(mappedCell);
                    input.value = txt;
                    if (txt) input.setAttribute("title", String(txt));

                    wrap.appendChild(label);
                    wrap.appendChild(input);
                    grid.appendChild(wrap);
                });

                record.appendChild(grid);
                def.container.appendChild(record);
            });
        });
    }

    _openRequisicao2Detalhe(documentid) {
        const modal = Util.q(this.root, `#modal-requisicao2${this.suffix}`);
        if (!modal) return;

        try {
            console.groupCollapsed(`[bevap_gestao_rh][req2] detalhe click (documentid=${this._safeStr(documentid)})`);
        } catch (e) {
            // noop
        }

        if (!this._ensureRequisicao2ModalBuilt()) {
            try {
                console.warn("[bevap_gestao_rh] Não foi possível montar o modal de Requisição 2 (config/DOM ausente)");
            } catch (e) {
                // noop
            }

            try {
                console.groupEnd();
            } catch (e) {
                // noop
            }
            return;
        }

        const row = this._fetchRequisicao2Detalhamento(documentid);
        this._fillRequisicao2Modal(row);

        const firstBtn = Util.q(modal, ".tab-btn");
        if (firstBtn) firstBtn.click();

        modal.classList.remove("hidden");
        this._updatePageScrollLock();

        try {
            console.groupEnd();
        } catch (e) {
            // noop
        }
    }

    loadRecrutamentoSelecaoParte1() {
        const section = Util.q(this.root, `#bevap-rh-recrutamento1${this.suffix}`);
        if (!section) return;

        const tbody = Util.q(section, "table.rh-table tbody");
        if (!tbody) return;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            this._retryLater("loadRecrutamentoSelecaoParte1", 10, 300);
            return;
        }

        let ds = null;
        try {
            ds = DatasetFactory.getDataset("ds_rastreabilidade_RH_recrutamento1", null, null, null);
        } catch (e) {
            ds = null;
        }

        const acc = this._asDatasetAccessor(ds);
        if (!acc || acc.rowsCount <= 0) {
            try {
                console.warn("[bevap_gestao_rh] ds_rastreabilidade_RH_recrutamento1 vazio/indisponível", ds);
            } catch (e) {
                // noop
            }
            this._setSectionTableEmpty(section, this._tableNoDataMessage());
            this.applyGlobalFilters();
            return;
        }

        const targetDef = "recrutamento_selecao";

        tbody.innerHTML = "";

        let visibleIndex = 0;
        for (let i = 0; i < acc.rowsCount; i += 1) {
            const defProc = this._normalizeStr(acc.getValue(i, "COD_DEF_PROCES"));
            if (defProc !== targetDef) continue;

            const idFluig = this._valueOrNA(acc.getValue(i, "idFluig"));
            const documentid = this._safeStr(
                acc.getValue(i, "documentid") || acc.getValue(i, "documentId") || acc.getValue(i, "DocumentId")
            );
            const situacao = this._safeStr(acc.getValue(i, "situacao"));
            const solicitante = this._valueOrNA(acc.getValue(i, "solicitante"));
            const cargoFuncao = this._valueOrNA(acc.getValue(i, "cargo"));
            const candidato = this._valueOrNA(acc.getValue(i, "candidato"));
            const etapaAtual = this._valueOrNA(this._stripLeadingCodeLabel(acc.getValue(i, "estadoProcesso")));
            const rawUltimaAtualizacao =
                acc.getValue(i, "ultimaAtualizacao") ||
                acc.getValue(i, "dataUltimaAtualizacao") ||
                acc.getValue(i, "ultima_atualizacao") ||
                acc.getValue(i, "dataInicio");
            const ultimaAtualizacao = this._valueOrNA(this._formatDateBr(this._safeStr(rawUltimaAtualizacao)));

            const responsavelId = this._safeStr(acc.getValue(i, "responsavel"));
            const responsavelNome = this._valueOrNA(this._getColleagueName(responsavelId));

            const tr = document.createElement("tr");
            tr.className = visibleIndex % 2 === 0 ? "rh-tr-odd" : "rh-tr-even";

            tr.setAttribute("data-process", "rec1");
            tr.setAttribute("data-status", this._normalizeStr(situacao));
            tr.setAttribute("data-solicitante", this._normalizeStr(solicitante));
            tr.setAttribute("data-date-ultima-atualizacao", this._toIsoDateOnly(rawUltimaAtualizacao));
            tr.setAttribute("data-date-inicio", this._toIsoDateOnly(acc.getValue(i, "dataInicio")));

            // Ordem obrigatória:
            // ID Fluig | Solicitante | Status | Cargo/Função | Candidato | Etapa Atual | Última Atualização | Responsável | Detalhe
            tr.appendChild(this._tdText(idFluig));
            tr.appendChild(this._tdText(solicitante));
            tr.appendChild(this._tdStatusBadge(situacao));
            tr.appendChild(this._tdText(cargoFuncao));
            tr.appendChild(this._tdText(candidato));
            tr.appendChild(this._tdText(etapaAtual));
            tr.appendChild(this._tdText(ultimaAtualizacao));
            tr.appendChild(this._tdText(responsavelNome));
            tr.appendChild(
                this._tdDetailButton(idFluig !== "N/A" ? idFluig : String(visibleIndex + 1), {
                    process: "rec1",
                    documentid,
                })
            );

            tbody.appendChild(tr);

            visibleIndex += 1;
        }

        this.applyGlobalFilters();
    }

    loadRecrutamentoSelecaoParte2() {
        const section = Util.q(this.root, `#bevap-rh-recrutamento2${this.suffix}`);
        if (!section) return;

        const tbody = Util.q(section, "table.rh-table tbody");
        if (!tbody) return;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            this._retryLater("loadRecrutamentoSelecaoParte2", 10, 300);
            return;
        }

        let ds = null;
        try {
            ds = DatasetFactory.getDataset("ds_rastreabilidade_RH_recrutamento2", null, null, null);
        } catch (e) {
            ds = null;
        }

        const acc = this._asDatasetAccessor(ds);
        if (!acc || acc.rowsCount <= 0) {
            try {
                console.warn("[bevap_gestao_rh] ds_rastreabilidade_RH_recrutamento2 vazio/indisponível", ds);
            } catch (e) {
                // noop
            }
            this._setSectionTableEmpty(section, this._tableNoDataMessage());
            this.applyGlobalFilters();
            return;
        }

        const normalizeYesNo = (v) => {
            const s = this._normalizeStr(v);
            if (!s) return "";
            if (s.indexOf("sim") > -1) return "sim";
            if (s.indexOf("nao") > -1 || s.indexOf("não") > -1) return "nao";
            return s;
        };

        const tdTextWithTitle = (text, title) => {
            const td = document.createElement("td");
            td.className = "rh-td";
            const t = this._safeStr(title);
            if (t) td.setAttribute("title", t);
            td.textContent = this._valueOrNA(text);
            return td;
        };

        tbody.innerHTML = "";

        const targetDef = "recrutamentoeselecaoparte2";

        let visibleIndex = 0;
        for (let i = 0; i < acc.rowsCount; i += 1) {
            const defProc = this._normalizeStr(acc.getValue(i, "COD_DEF_PROCES"));
            if (defProc !== targetDef) continue;

            const idFluig = this._valueOrNA(acc.getValue(i, "idFluig"));
            const documentid = this._safeStr(
                acc.getValue(i, "documentid") || acc.getValue(i, "documentId") || acc.getValue(i, "DocumentId")
            );
            const solicitante = this._valueOrNA(acc.getValue(i, "solicitante"));
            const situacao = this._safeStr(acc.getValue(i, "situacao"));
            const localizacao = this._valueOrNA(this._stripLeadingCodeLabel(acc.getValue(i, "estadoProcesso")));
            const cargoFuncao = this._valueOrNA(acc.getValue(i, "cargo"));
            const candidato = this._valueOrNA(acc.getValue(i, "candidato"));

            const aprov = normalizeYesNo(acc.getValue(i, "aprovParecerLideranca"));
            const resultadoTecnica = aprov === "sim" ? "APROVADO" : aprov === "nao" ? "REPROVADO" : "N/A";

            const parecerFinal =
                resultadoTecnica === "APROVADO"
                    ? "Apto para contratação"
                    : resultadoTecnica === "REPROVADO"
                    ? "Não apto para contratação"
                    : "N/A";

            const parecerLideranca = this._safeStr(acc.getValue(i, "parecerLideranca"));

            const responsavelId = this._safeStr(acc.getValue(i, "responsavel"));
            const responsavelTecnico = this._valueOrNA(this._getColleagueName(responsavelId));

            const rawDataFechamento =
                acc.getValue(i, "dataFechamento") ||
                acc.getValue(i, "data_fechamento") ||
                acc.getValue(i, "dataEncerramento") ||
                acc.getValue(i, "dataFim") ||
                acc.getValue(i, "dataInicio");
            const dataFechamento = this._valueOrNA(this._formatDateBr(this._safeStr(rawDataFechamento)));

            const tr = document.createElement("tr");
            tr.className = visibleIndex % 2 === 0 ? "rh-tr-odd" : "rh-tr-even";

            tr.setAttribute("data-process", "rec2");
            tr.setAttribute("data-status", this._normalizeStr(situacao));
            tr.setAttribute("data-solicitante", this._normalizeStr(solicitante));
            tr.setAttribute("data-date-fechamento", this._toIsoDateOnly(rawDataFechamento));
            tr.setAttribute("data-date-inicio", this._toIsoDateOnly(acc.getValue(i, "dataInicio")));

            tr.appendChild(this._tdText(idFluig));
            tr.appendChild(this._tdText(solicitante));
            tr.appendChild(this._tdStatusBadge(situacao));
            tr.appendChild(this._tdText(localizacao));
            tr.appendChild(this._tdText(cargoFuncao));
            tr.appendChild(this._tdText(candidato));
            tr.appendChild(this._tdText(resultadoTecnica));
            tr.appendChild(tdTextWithTitle(parecerFinal, parecerLideranca));
            tr.appendChild(this._tdText(responsavelTecnico));
            tr.appendChild(this._tdText(dataFechamento));
            tr.appendChild(
                this._tdDetailButton(idFluig !== "N/A" ? idFluig : String(visibleIndex + 1), {
                    process: "rec2",
                    documentid,
                })
            );

            tbody.appendChild(tr);

            visibleIndex += 1;
        }

        this.applyGlobalFilters();
    }

    _getColleagueName(colleagueId) {
        const id = this._safeStr(colleagueId);
        if (!id) return "";

        if (Object.prototype.hasOwnProperty.call(this._colleagueNameCache, id)) {
            return this._colleagueNameCache[id];
        }

        if (
            typeof DatasetFactory === "undefined" ||
            typeof DatasetFactory.createConstraint !== "function" ||
            typeof DatasetFactory.getDataset !== "function" ||
            typeof ConstraintType === "undefined"
        ) {
            this._colleagueNameCache[id] = "";
            return "";
        }

        const tryLookup = (fieldName) => {
            try {
                const c1 = DatasetFactory.createConstraint(fieldName, id, id, ConstraintType.MUST);
                const ds = DatasetFactory.getDataset("colleague", null, [c1], null);
                const acc = this._asDatasetAccessor(ds);
                if (acc && acc.rowsCount > 0) {
                    return this._safeStr(acc.getValue(0, "colleagueName"));
                }
            } catch (e) {
                // noop
            }
            return "";
        };

        // No client-side do Fluig, o constraint que funciona é "colleagueId".
        // Mantém fallback para ambientes que aceitem "colleaguePK.colleagueId".
        const nome = tryLookup("colleagueId") || tryLookup("colleaguePK.colleagueId");
        if (nome) {
            this._colleagueNameCache[id] = nome;
            return nome;
        }

        this._colleagueNameCache[id] = "";
        return "";
    }

    _asDatasetAccessor(ds) {
        if (!ds) return null;

        // Formato correto (client-side / Fluig): { values: [{col: val, ...}], columns: [...] }
        if (Array.isArray(ds.values)) {
            return {
                rowsCount: ds.values.length,
                getValue: (i, col) => {
                    const row = ds.values[i];
                    if (!row) return null;
                    return row[col];
                },
            };
        }

        return null;
    }

    _retryLater(key, maxTries, delayMs) {
        const k = String(key || "retry");
        const tries = Number(maxTries || 0);
        const delay = Number(delayMs || 0);
        if (tries <= 0 || delay <= 0) return;

        this._retries = this._retries || {};
        this._retries[k] = this._retries[k] || 0;
        if (this._retries[k] >= tries) return;
        this._retries[k] += 1;

        setTimeout(() => {
            try {
                if (typeof this[k] === "function") this[k]();
            } catch (e) {
                // noop
            }
        }, delay);
    }

    _tdText(value) {
        const td = document.createElement("td");
        td.className = "rh-td";
        const v = this._safeStr(value);
        td.textContent = v ? v : "N/A";
        // Tooltip com o valor completo (ajuda quando a célula é truncada com "...")
        const full = td.textContent;
        if (full) td.setAttribute("title", full);
        return td;
    }

    _tdStatusBadge(situacao) {
        const td = document.createElement("td");
        td.className = "rh-td";

        const span = document.createElement("span");
        const info = this._statusBadgeInfo(situacao);
        span.className = info.className;
        span.textContent = info.label;
        td.appendChild(span);

        td.setAttribute("title", info.label);

        return td;
    }

    _tdDetailButton(rowKey, meta) {
        const td = document.createElement("td");
        td.className = "rh-td-center";

        const button = document.createElement("button");
        button.className = "detail-btn";
        button.setAttribute("data-row", rowKey == null ? "" : String(rowKey));

        const m = meta || {};
        if (m.process) button.setAttribute("data-process", String(m.process));
        if (m.documentid) button.setAttribute("data-documentid", String(m.documentid));

        const icon = document.createElement("i");
        icon.className = "fa fa-eye rh-eye-icon";

        button.appendChild(icon);
        td.appendChild(button);
        return td;
    }

    _getAdmissaoDetalhamentoConfig() {
        try {
            const cfg = window.BEVAP_RH_ADMISSAO_DETALHAMENTO_CONFIG;
            if (!cfg || !cfg.panels || !Array.isArray(cfg.panels)) return null;
            return cfg;
        } catch (e) {
            return null;
        }
    }

    _ensureAdmissaoModalBuilt() {
        if (this._admissaoModalBuilt) return true;

        const cfg = this._getAdmissaoDetalhamentoConfig();
        const modal = Util.q(this.root, `#modal-admissao${this.suffix}`);
        const tabs = Util.q(this.root, `#modal-admissao-tabs${this.suffix}`);
        const body = Util.q(this.root, `#modal-admissao-body${this.suffix}`);
        if (!cfg || !modal || !tabs || !body) return false;

        // Reset container (keep close button).
        const closeBtn = Util.q(tabs, `#close-modal-admissao${this.suffix}`);
        Util.qa(tabs, ".tab-btn").forEach((b) => b.remove());
        body.innerHTML = "";

        this._admissaoModalFieldEls = {};
        this._admissaoModalChildTables = {};

        const makeSafeId = (s) => {
            const v = String(s || "");
            const normalized = typeof v.normalize === "function" ? v.normalize("NFD") : v;
            const cleaned = normalized
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();
            return cleaned ? cleaned : "tab";
        };

        cfg.panels.forEach((panel, idx) => {
            const tabKey = `adm-${makeSafeId(panel.domId || panel.title || String(idx))}-${idx}`;

            const btn = document.createElement("button");
            btn.className = "tab-btn" + (idx === 0 ? " tab-active" : "");
            btn.setAttribute("data-tab", tabKey);
            btn.textContent = String(panel.title || `Painel ${idx + 1}`);

            if (closeBtn) tabs.insertBefore(btn, closeBtn);
            else tabs.appendChild(btn);

            const tab = document.createElement("div");
            tab.className = "tab-content" + (idx === 0 ? "" : " hidden");
            tab.id = `tab-${tabKey}${this.suffix}`;

            (panel.sections || []).forEach((section) => {
                if (section.type === "section") {
                    const title = this._safeStr(section.title);
                    if (title) {
                        const h = document.createElement("h2");
                        h.className = "rh-modal-section-title";
                        h.textContent = title;
                        tab.appendChild(h);
                    }

                    const grid = document.createElement("div");
                    grid.className = "rh-modal-grid-2";

                    (section.fields || []).forEach((f) => {
                        const fieldId = this._safeStr(f.id);
                        if (!fieldId) return;

                        const wrap = document.createElement("div");
                        const label = document.createElement("label");
                        label.className = "rh-modal-label";
                        label.textContent = this._safeStr(f.label) || fieldId;

                        const input = document.createElement("input");
                        input.type = "text";
                        input.readOnly = true;
                        input.className = "input-modal";
                        input.setAttribute("data-field-id", fieldId);

                        wrap.appendChild(label);
                        wrap.appendChild(input);
                        grid.appendChild(wrap);

                        this._admissaoModalFieldEls[fieldId] = input;
                    });

                    if (grid.childElementCount > 0) tab.appendChild(grid);
                }

                if (section.type === "childTable") {
                    const tableId = this._safeStr(section.tableId);
                    if (!tableId) return;

                    const h = document.createElement("h2");
                    h.className = "rh-modal-section-title";
                    h.textContent = this._safeStr(section.title) || `Tabela Filho: ${tableId}`;
                    tab.appendChild(h);

                    // Render each child row as a block of inputs to avoid very wide tables.
                    const container = document.createElement("div");
                    container.setAttribute("data-child-table", tableId);
                    tab.appendChild(container);

                    const fields = [];
                    (section.fields || []).forEach((f) => {
                        const key = this._safeStr(f.key);
                        if (!key) return;
                        fields.push({ key, label: this._safeStr(f.label) || key });
                    });

                    this._admissaoModalChildTables[tableId] = { container, fields };
                }
            });

            body.appendChild(tab);
        });

        // Hook up tabs behavior for this dynamic modal.
        this._setupModalTabs(modal);

        this._admissaoModalBuilt = true;
        return true;
    }

    _logAdmissaoDetail(label, payload) {
        try {
            if (payload !== undefined) console.log(`[bevap_gestao_rh][admissao] ${label}`, payload);
            else console.log(`[bevap_gestao_rh][admissao] ${label}`);
        } catch (e) {
            // noop
        }
    }

    _setupModalTabs(modal) {
        if (!modal) return;

        Util.qa(modal, ".tab-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                Util.qa(modal, ".tab-btn").forEach((b) => b.classList.remove("tab-active"));
                btn.classList.add("tab-active");

                Util.qa(modal, ".tab-content").forEach((tab) => tab.classList.add("hidden"));
                const tabToShow = Util.q(modal, `#tab-${btn.dataset.tab}${this.suffix}`);
                if (tabToShow) tabToShow.classList.remove("hidden");
            });
        });
    }

    _updatePageScrollLock() {
        // Trava o scroll da página enquanto algum modal de detalhamento estiver aberto.
        // Usa um seletor global para cobrir múltiplas instâncias do widget na mesma página.
        try {
            const anyModalOpen = !!document.querySelector(".rh-modal:not(.hidden)");
            document.documentElement.classList.toggle("rh-scroll-locked", anyModalOpen);
            document.body.classList.toggle("rh-scroll-locked", anyModalOpen);
        } catch (e) {
            // noop
        }
    }

    _bindModalClose(modal, closeSelector) {
        if (!modal) return;
        const closeButton = closeSelector ? Util.q(modal, closeSelector) : null;
        if (closeButton) {
            closeButton.addEventListener("click", () => {
                modal.classList.add("hidden");
                this._updatePageScrollLock();
            });
        }

        // Click outside closes.
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
                this._updatePageScrollLock();
            }
        });
    }

    _fetchAdmissaoDetalhamento(documentid) {
        const cfg = this._getAdmissaoDetalhamentoConfig();
        if (!cfg) return null;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            return null;
        }

        const doc = this._safeStr(documentid);
        if (!doc) return null;

        this._logAdmissaoDetail("documentid", doc);
        this._logAdmissaoDetail("selectFields.count", Array.isArray(cfg.selectFields) ? cfg.selectFields.length : 0);

        const constraints = [];
        let canBuildConstraints = false;
        try {
            if (typeof DatasetFactory.createConstraint === "function" && typeof ConstraintType !== "undefined") {
                constraints.push(DatasetFactory.createConstraint("documentid", doc, doc, ConstraintType.MUST));
                // IMPORTANT: este dataset filtra por "tablename" (confirmado via console do Fluig)
                // Ex.: DatasetFactory.createConstraint("tablename", "ML001351", "ML001351", ConstraintType.MUST)
                const tableName = String(cfg.baseTable );
                constraints.push(DatasetFactory.createConstraint("tablename", tableName, tableName, ConstraintType.MUST));
                canBuildConstraints = true;
            }
        } catch (e) {
            // noop
        }

        if (!canBuildConstraints) {
            this._logAdmissaoDetail("WARN: não foi possível criar constraints (DatasetFactory.createConstraint/ConstraintType)");
        } else {
            this._logAdmissaoDetail("constraints", constraints);
        }

        const datasetName = String(cfg.dataset);

        const callDataset = (fields, label) => {
            let dsLocal = null;
            try {
                const cnt = Array.isArray(fields) ? fields.length : fields == null ? "(null)" : "(?)";
                this._logAdmissaoDetail(`dataset call ${label}.fields.count`, cnt);

                dsLocal = DatasetFactory.getDataset(
                    datasetName,
                    fields == null ? null : fields,
                    canBuildConstraints ? constraints : null,
                    null
                );
            } catch (e) {
                this._logAdmissaoDetail(`ERRO DatasetFactory.getDataset (${label})`, e);
                dsLocal = null;
            }
            return dsLocal;
        };


        // Apenas uma tentativa: usa selectFields do config (otimizado)
        let ds = callDataset(cfg.selectFields || null, "full");
        const valuesOf = (d) => (d && Array.isArray(d.values) ? d.values : []);
        let values = valuesOf(ds);
        this._logAdmissaoDetail("dataset.values.length (full)", values.length);
        if (!ds) {
            this._logAdmissaoDetail("dataset retorno = null");
            return null;
        }
        this._logAdmissaoDetail("dataset.attempt.used", "full");
        this._logAdmissaoDetail("dataset.values.length", values.length);
        if (values.length <= 0) {
            this._logAdmissaoDetail("dataset vazio", ds);
            return null;
        }

        // If constraints weren't built, try to find the correct row client-side.
        let row = values[0] || null;
        if (!canBuildConstraints) {
            const found = values.find((r) => this._safeStr(r && r.documentid) === doc);
            if (found) row = found;
            this._logAdmissaoDetail("row (fallback)", row);
            return row;
        }

        this._logAdmissaoDetail("row (0)", row);
        return row;
    }

    _parseMaybeJsonArray(value) {
        if (Array.isArray(value)) return value;
        const s = this._safeStr(value);
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            this._logAdmissaoDetail("WARN: JSON inválido em tabela filho", { value: s.slice(0, 200) });
            return [];
        }
    }

    _fixMojibakeText(value) {
        const s = this._safeStr(value);
        if (!s) return s;
        // Normal case: already ok.
        if (s.indexOf("Ã") === -1 && s.indexOf("Â") === -1) return s;
        // Typical prototype encoding: UTF-8 bytes interpreted as Latin-1.
        try {
            // eslint-disable-next-line no-undef
            return decodeURIComponent(escape(s));
        } catch (e) {
            return s;
        }
    }

    _getAdmissaoSelectDescFromRow(row, fieldId, rawValue) {
        const id = this._safeStr(fieldId);
        if (!id || id.indexOf(".") !== -1) return "";

        const src = row || {};

        const candidates = [];
        // Some fields already carry the dgf_ prefix (ex: dgf_beneficio1), so prefer "<id>_desc".
        candidates.push(`${id}_desc`);
        // Most public form selects store the label in a companion "dgf_<id>_desc" field.
        if (id.indexOf("dgf_") !== 0) candidates.push(`dgf_${id}_desc`);

        for (let i = 0; i < candidates.length; i += 1) {
            const k = candidates[i];
            if (!k) continue;
            if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
            const v = this._safeStr(src[k]);
            if (!v) continue;

            const fixed = this._fixMojibakeText(v);
            const raw = rawValue == null ? "" : String(rawValue);

            // Avoid replacing with same code-like content.
            if (fixed && fixed !== raw) return fixed;
            if (fixed) return fixed;
        }

        return "";
    }

    _mapAdmissaoSelectValue(fieldId, rawValue, row) {
        const id = this._safeStr(fieldId);
        if (!id) return rawValue;

        // Prefer dataset-provided description fields when present (dynamic selects).
        const desc = this._getAdmissaoSelectDescFromRow(row, id, rawValue);
        if (desc) return desc;

        const cfg = this._getAdmissaoDetalhamentoConfig();
        const maps = cfg && cfg.valueMaps ? cfg.valueMaps : null;
        if (!maps || !Object.prototype.hasOwnProperty.call(maps, id)) {
            const fallback = this._mapCommonYesNoValues(rawValue);
            return fallback ? fallback : rawValue;
        }

        const map = maps[id];
        if (!map) return rawValue;

        const key = rawValue == null ? "" : String(rawValue);
        if (!Object.prototype.hasOwnProperty.call(map, key)) {
            const fallback = this._mapCommonYesNoValues(rawValue);
            return fallback ? fallback : rawValue;
        }

        const label = map[key];
        return this._fixMojibakeText(label);
    }

    _mapCommonYesNoValues(rawValue) {
        if (rawValue == null) return "";
        const s = String(rawValue).trim();
        if (!s) return "";

        const low = s.toLowerCase();
        if (low === "sim") return "Sim";
        if (low === "nao") return "Não";
        if (low === "s") return "Sim";
        if (low === "n") return "Não";
        if (low === "true") return "Sim";
        if (low === "false") return "Não";

        return "";
    }

    _mapSelectValueFromConfig(cfg, fieldId, rawValue, row) {
        const id = this._safeStr(fieldId);
        if (!id) return rawValue;

        // Prefer dataset-provided description fields when present (useful for dynamic combos).
        const desc = this._getAdmissaoSelectDescFromRow(row, id, rawValue);
        if (desc) return desc;

        const maps = cfg && cfg.valueMaps ? cfg.valueMaps : null;
        if (!maps || !Object.prototype.hasOwnProperty.call(maps, id)) {
            const fallback = this._mapCommonYesNoValues(rawValue);
            return fallback ? fallback : rawValue;
        }

        const map = maps[id];
        if (!map) return rawValue;

        const key = rawValue == null ? "" : String(rawValue);
        if (!Object.prototype.hasOwnProperty.call(map, key)) {
            const fallback = this._mapCommonYesNoValues(rawValue);
            return fallback ? fallback : rawValue;
        }

        const label = map[key];
        return this._fixMojibakeText(label);
    }

    _resolveAdmissaoFieldValue(values, fieldId) {
        const id = this._safeStr(fieldId);
        if (!id) return "";

        // Normal fields: read directly from row.
        if (id.indexOf(".") === -1) return values ? values[id] : "";

        // Special case: pseudo-fields from child JSON tables.
        const parts = id.split(".");
        const tableId = this._safeStr(parts[0]);
        const lookupKey = parts.slice(1).join(".");
        if (!tableId || !lookupKey) return "";

        const arr = this._parseMaybeJsonArray(values ? values[tableId] : null);
        if (!arr || arr.length === 0) return "";

        // For tbCamposAdicional, the "field name" is stored in cp_adicional_nome.
        if (tableId === "tbCamposAdicional") {
            const found = arr.find((it) => this._safeStr(it && it.cp_adicional_nome) === lookupKey);
            if (!found) return "";
            const v = found.cp_adicional_valor;
            const txt = this._safeStr(v);
            // We only display the actual answered value. When nothing is marked/filled,
            // keep it empty so the UI shows N/A instead of option lists.
            return txt ? v : "";
        }

        // Generic fallback: if a JSON record has this key, use the first match.
        const item = arr.find((it) => it && lookupKey in it);
        return item ? item[lookupKey] : "";
    }

    _fillAdmissaoModal(row) {
        const modal = Util.q(this.root, `#modal-admissao${this.suffix}`);
        if (!modal) return;

        const values = row || {};

        this._logAdmissaoDetail("preenchendo modal com row", values);

        // Fill simple fields.
        const fieldEls = this._admissaoModalFieldEls || {};
        Object.keys(fieldEls).forEach((fieldId) => {
            const el = fieldEls[fieldId];
            if (!el) return;
            const raw = this._resolveAdmissaoFieldValue(values, fieldId);
            const mapped = this._mapAdmissaoSelectValue(fieldId, raw, values);
            const v = this._valueOrNA(mapped);
            el.value = v;
            if (v) el.setAttribute("title", String(v));
            else el.removeAttribute("title");
        });

        // Fill child tables.
        const tables = this._admissaoModalChildTables || {};
        Object.keys(tables).forEach((tableId) => {
            const def = tables[tableId];
            if (!def || !def.container) return;
            def.container.innerHTML = "";

            const arr = this._parseMaybeJsonArray(values[tableId]);
            if (!arr || arr.length === 0) {
                const empty = document.createElement("div");
                empty.className = "rh-modal-field";
                empty.textContent = "Nenhum registro";
                def.container.appendChild(empty);
                return;
            }

            arr.forEach((item, idx) => {
                const record = document.createElement("div");
                record.className = "rh-modal-record";

                const recordTitle = document.createElement("label");
                recordTitle.className = "rh-modal-label-bold";
                recordTitle.textContent = `Registro ${idx + 1}`;
                record.appendChild(recordTitle);

                const grid = document.createElement("div");
                grid.className = "rh-modal-grid-2";

                (def.fields || []).forEach((col) => {
                    const wrap = document.createElement("div");
                    const label = document.createElement("label");
                    label.className = "rh-modal-label";
                    label.textContent = this._safeStr(col.label) || this._safeStr(col.key);

                    const input = document.createElement("input");
                    input.type = "text";
                    input.readOnly = true;
                    input.className = "input-modal";

                    const cell = item && col && col.key in item ? item[col.key] : "";
                    const mappedCell = this._mapAdmissaoSelectValue(col.key, cell, item);
                    const txt = this._valueOrNA(mappedCell);
                    input.value = txt;
                    if (txt) input.setAttribute("title", String(txt));

                    wrap.appendChild(label);
                    wrap.appendChild(input);
                    grid.appendChild(wrap);
                });

                record.appendChild(grid);
                def.container.appendChild(record);
            });
        });
    }

    _openAdmissaoDetalhe(documentid) {
        const modal = Util.q(this.root, `#modal-admissao${this.suffix}`);
        if (!modal) return;

        try {
            console.groupCollapsed(`[bevap_gestao_rh][admissao] detalhe click (documentid=${this._safeStr(documentid)})`);
        } catch (e) {
            // noop
        }

        if (!this._ensureAdmissaoModalBuilt()) {
            try {
                console.warn("[bevap_gestao_rh] Não foi possível montar o modal de Admissão (config/DOM ausente)");
            } catch (e) {
                // noop
            }

            try {
                console.groupEnd();
            } catch (e) {
                // noop
            }
            return;
        }

        const row = this._fetchAdmissaoDetalhamento(documentid);
        this._fillAdmissaoModal(row);

        // Activate first tab.
        const firstBtn = Util.q(modal, ".tab-btn");
        if (firstBtn) firstBtn.click();

        modal.classList.remove("hidden");
        this._updatePageScrollLock();

        try {
            console.groupEnd();
        } catch (e) {
            // noop
        }
    }

    _getRequisicao1DetalhamentoConfig() {
        try {
            const cfg = window.BEVAP_RH_REQUISICAO1_DETALHAMENTO_CONFIG;
            if (!cfg || !cfg.panels || !Array.isArray(cfg.panels)) return null;
            return cfg;
        } catch (e) {
            return null;
        }
    }

    _ensureRequisicao1ModalBuilt() {
        if (this._requisicao1ModalBuilt) return true;

        const cfg = this._getRequisicao1DetalhamentoConfig();
        const modal = Util.q(this.root, `#modal-requisicao1${this.suffix}`);
        const tabs = Util.q(this.root, `#modal-requisicao1-tabs${this.suffix}`);
        const body = Util.q(this.root, `#modal-requisicao1-body${this.suffix}`);
        if (!cfg || !modal || !tabs || !body) return false;

        // Reset container (keep close button).
        const closeBtn = Util.q(tabs, `#close-modal-requisicao1${this.suffix}`);
        Util.qa(tabs, ".tab-btn").forEach((b) => b.remove());
        body.innerHTML = "";

        this._requisicao1ModalFieldEls = {};
        this._requisicao1ModalChildTables = {};

        const makeSafeId = (s) => {
            const v = String(s || "");
            const normalized = typeof v.normalize === "function" ? v.normalize("NFD") : v;
            const cleaned = normalized
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();
            return cleaned ? cleaned : "tab";
        };

        cfg.panels.forEach((panel, idx) => {
            const tabKey = `req1-${makeSafeId(panel.domId || panel.title || String(idx))}-${idx}`;

            const btn = document.createElement("button");
            btn.className = "tab-btn" + (idx === 0 ? " tab-active" : "");
            btn.setAttribute("data-tab", tabKey);
            btn.textContent = String(panel.title || `Painel ${idx + 1}`);

            if (closeBtn) tabs.insertBefore(btn, closeBtn);
            else tabs.appendChild(btn);

            const tab = document.createElement("div");
            tab.className = "tab-content" + (idx === 0 ? "" : " hidden");
            tab.id = `tab-${tabKey}${this.suffix}`;

            (panel.sections || []).forEach((section) => {
                if (section.type === "section") {
                    const title = this._safeStr(section.title);
                    if (title) {
                        const h = document.createElement("h2");
                        h.className = "rh-modal-section-title";
                        h.textContent = title;
                        tab.appendChild(h);
                    }

                    const grid = document.createElement("div");
                    grid.className = "rh-modal-grid-2";

                    (section.fields || []).forEach((f) => {
                        const fieldId = this._safeStr(f.id);
                        if (!fieldId) return;

                        const wrap = document.createElement("div");
                        const label = document.createElement("label");
                        label.className = "rh-modal-label";
                        label.textContent = this._safeStr(f.label) || fieldId;

                        const input = document.createElement("input");
                        input.type = "text";
                        input.readOnly = true;
                        input.className = "input-modal";
                        input.setAttribute("data-field-id", fieldId);

                        wrap.appendChild(label);
                        wrap.appendChild(input);
                        grid.appendChild(wrap);

                        this._requisicao1ModalFieldEls[fieldId] = input;
                    });

                    if (grid.childElementCount > 0) tab.appendChild(grid);
                }

                if (section.type === "childTable") {
                    const tableId = this._safeStr(section.tableId);
                    if (!tableId) return;

                    const h = document.createElement("h2");
                    h.className = "rh-modal-section-title";
                    h.textContent = this._safeStr(section.title) || `Tabela Filho: ${tableId}`;
                    tab.appendChild(h);

                    const container = document.createElement("div");
                    container.setAttribute("data-child-table", tableId);
                    tab.appendChild(container);

                    const fields = [];
                    (section.fields || []).forEach((f) => {
                        const key = this._safeStr(f.key);
                        if (!key) return;
                        fields.push({ key, label: this._safeStr(f.label) || key });
                    });

                    this._requisicao1ModalChildTables[tableId] = { container, fields };
                }
            });

            body.appendChild(tab);
        });

        this._setupModalTabs(modal);

        this._requisicao1ModalBuilt = true;
        return true;
    }

    _logRequisicao1Detail(label, payload) {
        try {
            if (payload !== undefined) console.log(`[bevap_gestao_rh][req1] ${label}`, payload);
            else console.log(`[bevap_gestao_rh][req1] ${label}`);
        } catch (e) {
            // noop
        }
    }

    _parseMaybeJsonArrayReq1(value) {
        if (Array.isArray(value)) return value;
        const s = this._safeStr(value);
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            this._logRequisicao1Detail("WARN: JSON inválido em tabela filho", { value: s.slice(0, 200) });
            return [];
        }
    }

    _fetchRequisicao1Detalhamento(documentid) {
        const cfg = this._getRequisicao1DetalhamentoConfig();
        if (!cfg) return null;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            return null;
        }

        const doc = this._safeStr(documentid);
        if (!doc) return null;

        this._logRequisicao1Detail("documentid", doc);
        this._logRequisicao1Detail("selectFields.count", Array.isArray(cfg.selectFields) ? cfg.selectFields.length : 0);

        const constraints = [];
        let canBuildConstraints = false;
        try {
            if (typeof DatasetFactory.createConstraint === "function" && typeof ConstraintType !== "undefined") {
                constraints.push(DatasetFactory.createConstraint("documentid", doc, doc, ConstraintType.MUST));
                const tableName = String(cfg.baseTable);
                constraints.push(DatasetFactory.createConstraint("tablename", tableName, tableName, ConstraintType.MUST));
                canBuildConstraints = true;
            }
        } catch (e) {
            // noop
        }

        if (!canBuildConstraints) {
            this._logRequisicao1Detail(
                "WARN: não foi possível criar constraints (DatasetFactory.createConstraint/ConstraintType)"
            );
        } else {
            this._logRequisicao1Detail("constraints", constraints);
        }

        const datasetName = String(cfg.dataset);
        const callDataset = (fields, label) => {
            let dsLocal = null;
            try {
                const cnt = Array.isArray(fields) ? fields.length : fields == null ? "(null)" : "(?)";
                this._logRequisicao1Detail(`dataset call ${label}.fields.count`, cnt);
                dsLocal = DatasetFactory.getDataset(
                    datasetName,
                    fields == null ? null : fields,
                    canBuildConstraints ? constraints : null,
                    null
                );
            } catch (e) {
                this._logRequisicao1Detail(`ERRO DatasetFactory.getDataset (${label})`, e);
                dsLocal = null;
            }
            return dsLocal;
        };

        let ds = callDataset(cfg.selectFields || null, "full");
        const valuesOf = (d) => (d && Array.isArray(d.values) ? d.values : []);
        let values = valuesOf(ds);
        this._logRequisicao1Detail("dataset.values.length", values.length);
        if (!ds) {
            this._logRequisicao1Detail("dataset retorno = null");
            return null;
        }
        if (values.length <= 0) {
            this._logRequisicao1Detail("dataset vazio", ds);
            return null;
        }

        let row = values[0] || null;
        if (!canBuildConstraints) {
            const found = values.find((r) => this._safeStr(r && r.documentid) === doc);
            if (found) row = found;
            this._logRequisicao1Detail("row (fallback)", row);
        }

        this._logRequisicao1Detail("row (0)", row);

        return row;
    }

    _resolveRequisicao1FieldValue(values, fieldId) {
        const id = this._safeStr(fieldId);
        if (!id) return "";

        if (id.indexOf(".") === -1) return values ? values[id] : "";

        const parts = id.split(".");
        const tableId = this._safeStr(parts[0]);
        const lookupKey = parts.slice(1).join(".");
        if (!tableId || !lookupKey) return "";

        const arr = this._parseMaybeJsonArrayReq1(values ? values[tableId] : null);
        if (!arr || arr.length === 0) return "";

        const item = arr.find((it) => it && lookupKey in it);
        return item ? item[lookupKey] : "";
    }

    _fillRequisicao1Modal(row) {
        const modal = Util.q(this.root, `#modal-requisicao1${this.suffix}`);
        if (!modal) return;

        const values = row || {};

        const cfg = this._getRequisicao1DetalhamentoConfig();

        const fieldEls = this._requisicao1ModalFieldEls || {};
        Object.keys(fieldEls).forEach((fieldId) => {
            const el = fieldEls[fieldId];
            if (!el) return;
            const raw = this._resolveRequisicao1FieldValue(values, fieldId);
            const mapped = this._mapSelectValueFromConfig(cfg, fieldId, raw, values);
            const v = this._valueOrNA(mapped);
            el.value = v;
            if (v) el.setAttribute("title", String(v));
            else el.removeAttribute("title");
        });

        const tables = this._requisicao1ModalChildTables || {};
        Object.keys(tables).forEach((tableId) => {
            const def = tables[tableId];
            if (!def || !def.container) return;
            def.container.innerHTML = "";

            const arr = this._parseMaybeJsonArrayReq1(values[tableId]);
            if (!arr || arr.length === 0) {
                const empty = document.createElement("div");
                empty.className = "rh-modal-field";
                empty.textContent = "Nenhum registro";
                def.container.appendChild(empty);
                return;
            }

            arr.forEach((item, idx) => {
                const record = document.createElement("div");
                record.className = "rh-modal-record";

                const recordTitle = document.createElement("label");
                recordTitle.className = "rh-modal-label-bold";
                recordTitle.textContent = `Registro ${idx + 1}`;
                record.appendChild(recordTitle);

                const grid = document.createElement("div");
                grid.className = "rh-modal-grid-2";

                (def.fields || []).forEach((col) => {
                    const wrap = document.createElement("div");
                    const label = document.createElement("label");
                    label.className = "rh-modal-label";
                    label.textContent = this._safeStr(col.label) || this._safeStr(col.key);

                    const input = document.createElement("input");
                    input.type = "text";
                    input.readOnly = true;
                    input.className = "input-modal";

                    const cell = item && col && col.key in item ? item[col.key] : "";
                    const mappedCell = this._mapSelectValueFromConfig(cfg, col.key, cell, item);
                    const txt = this._valueOrNA(mappedCell);
                    input.value = txt;
                    if (txt) input.setAttribute("title", String(txt));

                    wrap.appendChild(label);
                    wrap.appendChild(input);
                    grid.appendChild(wrap);
                });

                record.appendChild(grid);
                def.container.appendChild(record);
            });
        });
    }

    _openRequisicao1Detalhe(documentid) {
        const modal = Util.q(this.root, `#modal-requisicao1${this.suffix}`);
        if (!modal) return;

        try {
            console.groupCollapsed(`[bevap_gestao_rh][req1] detalhe click (documentid=${this._safeStr(documentid)})`);
        } catch (e) {
            // noop
        }

        if (!this._ensureRequisicao1ModalBuilt()) {
            try {
                console.warn("[bevap_gestao_rh] Não foi possível montar o modal de Requisição 1 (config/DOM ausente)");
            } catch (e) {
                // noop
            }

            try {
                console.groupEnd();
            } catch (e) {
                // noop
            }
            return;
        }

        const row = this._fetchRequisicao1Detalhamento(documentid);
        this._fillRequisicao1Modal(row);

        const firstBtn = Util.q(modal, ".tab-btn");
        if (firstBtn) firstBtn.click();

        modal.classList.remove("hidden");
        this._updatePageScrollLock();

        try {
            console.groupEnd();
        } catch (e) {
            // noop
        }
    }

    _statusBadgeInfo(raw) {
        const v = this._normalizeStr(raw);
        if (!v) {
            return { label: "N/A", className: "rh-badge rh-badge-blue" };
        }
        if (v === "encerrado") {
            return { label: "Encerrado", className: "rh-badge rh-badge-green" };
        }
        if (v === "cancelado") {
            return { label: "Cancelado", className: "rh-badge rh-badge-red" };
        }
        // default e também para "Em Andamento"
        return { label: "Em Andamento", className: "rh-badge rh-badge-blue" };
    }

    _formatDateBr(value) {
        const v = this._safeStr(value);
        if (!v) return "";

        // Já está dd/MM/yyyy
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;

        // ISO (yyyy-MM-dd) ou datetime
        const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
            return `${m[3]}/${m[2]}/${m[1]}`;
        }

        // Fallback: tenta parsear
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yyyy = String(d.getFullYear());
            return `${dd}/${mm}/${yyyy}`;
        }

        return v;
    }

    _toIsoDateOnly(value) {
        const v = this._safeStr(value);
        if (!v) return "";

        // ISO (yyyy-MM-dd) or datetime
        const mIso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (mIso) return `${mIso[1]}-${mIso[2]}-${mIso[3]}`;

        // BR (dd/MM/yyyy) optionally with time
        const mBr = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (mBr) return `${mBr[3]}-${mBr[2]}-${mBr[1]}`;

        // Fallback parse
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yyyy = String(d.getFullYear());
            return `${yyyy}-${mm}-${dd}`;
        }

        return "";
    }

    _rowMatchesPeriod(row, periodIso) {
        const p = this._safeStr(periodIso);
        if (!p) return true;
        if (!row) return false;

        const attrs = [
            "data-date-solicitacao",
            "data-date-inicio",
            "data-date-ultima-atualizacao",
            "data-date-fechamento",
        ];

        for (let i = 0; i < attrs.length; i += 1) {
            const v = this._safeStr(row.getAttribute(attrs[i]));
            if (v && v === p) return true;
        }

        // Fallback: compare against rendered dd/MM/yyyy in the row.
        const periodBr = this._formatDateBr(p);
        if (!periodBr) return false;
        const rowText = this._safeStr(row.textContent || row.innerText || "");
        return rowText.indexOf(periodBr) > -1;
    }

    _safeStr(v) {
        if (v == null) return "";
        const s = String(v);
        return s === "null" || s === "undefined" ? "" : s.trim();
    }

    _stripLeadingCodeLabel(v) {
        // Normaliza valores do tipo "103 - Aprovação" -> "Aprovação".
        // Aceita hífen (-) e variações de dash (–, —).
        const s = this._safeStr(v);
        if (!s) return "";

        const cleaned = s.replace(/^\s*\d+\s*[-–—]\s*/, "").trim();
        return cleaned ? cleaned : s;
    }

    _valueOrNA(v) {
        const s = this._safeStr(v);
        if (!s) return "N/A";

        // Global display rules (apply to all 5 detalhamentos):
        // - "Selecione" is a placeholder -> treat as empty => N/A
        // - "on" is a common checkbox value -> display as "Sim"
        const norm = s.toLowerCase();
        if (norm === "selecione") return "N/A";
        if (norm === "Selecione...") return "N/A";
        if (norm === "Selecione") return "N/A";
        if (norm === "SELECIONE") return "N/A";
        if (norm === "SELECIONE...") return "N/A";
        if (norm === "on") return "Sim";

        return s;
    }

    _normalizeStr(v) {
        return this._safeStr(v).toLowerCase();
    }

    ensureVisible() {
        if (!this.root) return;

        this.root.style.display = "block";
        this.root.style.visibility = "visible";
        this.root.style.opacity = "1";

        const layoutRoot = this.root.querySelector(".bevap-rh-root");
        if (layoutRoot) {
            layoutRoot.style.display = "block";
            layoutRoot.style.visibility = "visible";
            layoutRoot.style.opacity = "1";
        }
    }

    installVisibilityWatchdog() {
        if (!this.root) return;
        if (this._visibilityWatchdogTimer) return;

        let ticks = 0;
        const maxTicks = 24; // ~6s

        this._visibilityWatchdogTimer = setInterval(() => {
            ticks += 1;

            const rootCs = this.safeComputedStyle(this.root);
            const rootRect = this.safeRect(this.root);

            const isHidden =
                !rootCs ||
                rootCs.display === "none" ||
                rootCs.visibility === "hidden" ||
                rootCs.opacity === "0" ||
                (rootRect && (rootRect.width === 0 || rootRect.height === 0));

            

            if (ticks >= maxTicks) {
                clearInterval(this._visibilityWatchdogTimer);
                this._visibilityWatchdogTimer = null;
            }
        }, 250);
    }

    safeComputedStyle(el) {
        try {
            return el ? window.getComputedStyle(el) : null;
        } catch (e) {
            return null;
        }
    }

    safeRect(el) {
        try {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
                x: Math.round(r.x),
                y: Math.round(r.y),
                width: Math.round(r.width),
                height: Math.round(r.height),
            };
        } catch (e) {
            return null;
        }
    }

    debugVisibility(tag) {
        if (!this.root) return;

        const layoutRoot = this.root.querySelector(".bevap-rh-root");
        const main = Util.q(this.root, `#bevap-rh-main${this.suffix}`);

        const rootCs = this.safeComputedStyle(this.root);
        const layoutCs = this.safeComputedStyle(layoutRoot);
        const mainCs = this.safeComputedStyle(main);

        const rootRect = this.safeRect(this.root);
        const layoutRect = this.safeRect(layoutRoot);
        const mainRect = this.safeRect(main);

        let topElInfo = null;
        try {
            const probeX = rootRect ? Math.max(1, Math.min(window.innerWidth - 2, rootRect.x + 20)) : Math.floor(window.innerWidth / 2);
            const probeY = rootRect ? Math.max(1, Math.min(window.innerHeight - 2, rootRect.y + 20)) : Math.floor(window.innerHeight / 2);
            const topEl = document.elementFromPoint(probeX, probeY);
            if (topEl) {
                const topCs = this.safeComputedStyle(topEl);
                topElInfo = {
                    probe: { x: probeX, y: probeY },
                    tag: topEl.tagName,
                    id: topEl.id || null,
                    className: topEl.className || null,
                    insideWidget: this.root.contains(topEl),
                    position: topCs ? topCs.position : null,
                    zIndex: topCs ? topCs.zIndex : null,
                    opacity: topCs ? topCs.opacity : null,
                    pointerEvents: topCs ? topCs.pointerEvents : null,
                };
            }
        } catch (e) {
            // noop
        }

        try {
            const payload = {
                root: {
                    display: rootCs ? rootCs.display : null,
                    visibility: rootCs ? rootCs.visibility : null,
                    opacity: rootCs ? rootCs.opacity : null,
                    color: rootCs ? rootCs.color : null,
                    rect: rootRect,
                },
                layoutRoot: {
                    display: layoutCs ? layoutCs.display : null,
                    visibility: layoutCs ? layoutCs.visibility : null,
                    opacity: layoutCs ? layoutCs.opacity : null,
                    rect: layoutRect,
                },
                main: {
                    display: mainCs ? mainCs.display : null,
                    visibility: mainCs ? mainCs.visibility : null,
                    opacity: mainCs ? mainCs.opacity : null,
                    rect: mainRect,
                },
                topElement: topElInfo,
            };

            
        } catch (e) {
            // noop
        }
    }

    applyPortalLayoutFixesLikeEmailWidget() {
        // Replica o que a wdGeracaoAssinaturas faz (a que funciona):
        // - remove título padrão da página
        // - ajusta o slot para não colapsar/desalinha layouts
        try {
            if (typeof window.$ === "function") {
                window.$("h2.pageTitle").remove();
                window.$("#slotFull1").addClass("fs-md-margin-left");
                window.$("#slotFull1").css({ display: "block", visibility: "visible", opacity: 1 });
            } else {
                const title = document.querySelector("h2.pageTitle");
                if (title && title.parentNode) title.parentNode.removeChild(title);

                const slot = document.getElementById("slotFull1");
                if (slot) {
                    slot.classList.add("fs-md-margin-left");
                    slot.style.display = "block";
                    slot.style.visibility = "visible";
                    slot.style.opacity = "1";
                }
            }
        } catch (e) {
            // noop
        }
    }

    setupTableFilter(inputId, tableId) {
        const input = Util.q(this.root, `#${inputId}`);
        const table = Util.q(this.root, `#${tableId}`);

        if (!input || !table) return;

        const tbody = table.getElementsByTagName("tbody")[0];
        if (!tbody) return;

        const applyFilter = () => {
            const filterValue = (input.value || "").toLowerCase();
            const rows = Array.from(tbody.getElementsByTagName("tr"));

            rows.forEach((row) => {
                if (row && row.getAttribute && row.getAttribute("data-empty-row") === "1") return;
                const rowText = (row.textContent || row.innerText || "").toLowerCase();
                row.style.display = rowText.indexOf(filterValue) > -1 ? "" : "none";
            });

            // Mantém a compatibilidade com o filtro global já aplicado.
            // (Filtro global NÃO deve aplicar automaticamente por conta própria.)
            try {
                this.applyGlobalFilters();
            } catch (e) {
                // noop
            }
        };

        input.addEventListener("input", applyFilter);
    }

    setupGlobalFilters() {
        const processoEl = Util.q(this.root, `#filtro-processo${this.suffix}`);
        const statusEl = Util.q(this.root, `#filtro-status${this.suffix}`);
        const solicitanteEl = Util.q(this.root, `#filtro-solicitante${this.suffix}`);
        const periodoEl = Util.q(this.root, `#filtro-periodo${this.suffix}`);
        const btnFiltrar = Util.q(this.root, `#btn-filtrar${this.suffix}`);
        const btnLimpar = Util.q(this.root, `#btn-limpar${this.suffix}`);

        if (!processoEl || !statusEl || !solicitanteEl) return;

        this._globalFiltersEls = {
            processoEl,
            statusEl,
            solicitanteEl,
            periodoEl,
            btnFiltrar,
            btnLimpar,
        };

        // Estado aplicado (só muda ao clicar em Filtrar/Limpar)
        this._globalFiltersApplied = { process: "all", status: "", solicitante: "", period: "" };

        if (btnFiltrar) {
            btnFiltrar.addEventListener("click", (e) => {
                try {
                    if (e && typeof e.preventDefault === "function") e.preventDefault();
                } catch (err) {
                    // noop
                }
                this._globalFiltersApplied = this._readGlobalFiltersControls();
                this.applyGlobalFilters();
            });
        }

        if (btnLimpar) {
            btnLimpar.addEventListener("click", (e) => {
                try {
                    if (e && typeof e.preventDefault === "function") e.preventDefault();
                } catch (err) {
                    // noop
                }

                try {
                    processoEl.selectedIndex = 0;
                    statusEl.selectedIndex = 0;
                    solicitanteEl.value = "";
                    if (periodoEl) periodoEl.value = "";
                } catch (err) {
                    // noop
                }

                // Também limpa os filtros individuais das tabelas (volta tudo ao padrão).
                try {
                    const ids = [
                        `#filtro-adm${this.suffix}`,
                        `#filtro-req1${this.suffix}`,
                        `#filtro-req2${this.suffix}`,
                        `#filtro-rec1${this.suffix}`,
                        `#filtro-rec2${this.suffix}`,
                    ];
                    ids.forEach((sel) => {
                        const el = Util.q(this.root, sel);
                        if (el) el.value = "";
                    });
                } catch (err) {
                    // noop
                }

                this._globalFiltersApplied = { process: "all", status: "", solicitante: "", period: "" };
                this.applyGlobalFilters();
            });
        }

        // Aplica o estado inicial ("Todos") quando os dados carregarem.
        this.applyGlobalFilters();
    }

    _processKeyFromLabel(label) {
        const s = this._normalizeStr(label);
        if (!s) return "all";

        if (s.indexOf("todos") > -1) return "all";
        if (s.indexOf("admiss") > -1) return "admissao";

        if (s.indexOf("requis") > -1 && s.indexOf("parte 1") > -1) return "req1";
        if (s.indexOf("requis") > -1 && s.indexOf("parte 2") > -1) return "req2";

        if (s.indexOf("recrut") > -1 && s.indexOf("parte 1") > -1) return "rec1";
        if (s.indexOf("recrut") > -1 && s.indexOf("parte 2") > -1) return "rec2";

        return "all";
    }

    _readGlobalFiltersControls() {
        const els = this._globalFiltersEls;
        if (!els) {
            return { process: "all", status: "", solicitante: "", period: "" };
        }

        const process = this._processKeyFromLabel(els.processoEl ? els.processoEl.value : "");

        const statusRaw = this._normalizeStr(els.statusEl ? els.statusEl.value : "");
        const status = statusRaw.indexOf("todos") > -1 ? "" : statusRaw;

        const solicitante = this._normalizeStr(els.solicitanteEl ? els.solicitanteEl.value : "");

        // <input type="date"> returns yyyy-MM-dd
        const period = this._safeStr(els.periodoEl ? els.periodoEl.value : "");

        return { process, status, solicitante, period };
    }

    _readAppliedGlobalFilters() {
        const f = this._globalFiltersApplied;
        if (!f) return { process: "all", status: "", solicitante: "", period: "" };
        return {
            process: f.process || "all",
            status: f.status || "",
            solicitante: f.solicitante || "",
            period: f.period || "",
        };
    }

    _sectionByProcessKey() {
        return {
            admissao: Util.q(this.root, `#bevap-rh-admissao${this.suffix}`),
            req1: Util.q(this.root, `#bevap-rh-requisicao${this.suffix}`),
            req2: Util.q(this.root, `#bevap-rh-requisicao2${this.suffix}`),
            rec1: Util.q(this.root, `#bevap-rh-recrutamento1${this.suffix}`),
            rec2: Util.q(this.root, `#bevap-rh-recrutamento2${this.suffix}`),
        };
    }

    _tableLocalFilterValue(processKey) {
        const idMap = {
            admissao: `filtro-adm${this.suffix}`,
            req1: `filtro-req1${this.suffix}`,
            req2: `filtro-req2${this.suffix}`,
            rec1: `filtro-rec1${this.suffix}`,
            rec2: `filtro-rec2${this.suffix}`,
        };

        const id = idMap[processKey];
        if (!id) return "";
        const el = Util.q(this.root, `#${id}`);
        return this._normalizeStr(el ? el.value : "");
    }

    applyGlobalFilters() {
        const filters = this._readAppliedGlobalFilters();
        const sections = this._sectionByProcessKey();

        const showProcess = (key) => filters.process === "all" || filters.process === key;

        Object.keys(sections).forEach((key) => {
            const section = sections[key];
            if (!section) return;
            section.style.display = showProcess(key) ? "" : "none";
        });

        const applyToSectionRows = (key) => {
            const section = sections[key];
            if (!section) return;
            if (section.style.display === "none") return;

            const tbody = Util.q(section, "table.rh-table tbody");
            if (!tbody) return;

            const table = Util.q(section, "table.rh-table");

            const localFilter = this._tableLocalFilterValue(key);
            const rows = Array.from(tbody.getElementsByTagName("tr"));

            rows.forEach((row) => {
                if (row && row.getAttribute && row.getAttribute("data-empty-row") === "1") return;
                const rowStatus = this._normalizeStr(row.getAttribute("data-status"));
                const rowSolic = this._normalizeStr(row.getAttribute("data-solicitante"));

                const matchesStatus = !filters.status || rowStatus === filters.status;
                const matchesSolic = !filters.solicitante || rowSolic.indexOf(filters.solicitante) > -1;
                const matchesPeriod = !filters.period || this._rowMatchesPeriod(row, filters.period);

                let matchesLocal = true;
                if (localFilter) {
                    const rowText = this._normalizeStr(row.textContent || row.innerText || "");
                    matchesLocal = rowText.indexOf(localFilter) > -1;
                }

                row.style.display = matchesStatus && matchesSolic && matchesPeriod && matchesLocal ? "" : "none";
            });

            this._syncEmptyRowForTable(table, this._tableNoDataMessage());
        };

        applyToSectionRows("admissao");
        applyToSectionRows("req1");
        applyToSectionRows("req2");
        applyToSectionRows("rec1");
        applyToSectionRows("rec2");
    }

    setupPainelCollapse() {
        const headers = Util.qa(this.root, ".painel-header");

        const setExpanded = (header, content, expanded) => {
            if (!header || !content) return;

            // Ensure we never use display:none here, otherwise there's no animation.
            content.classList.remove("hidden");

            const icon = header.querySelector("i");
            if (icon) icon.classList.toggle("rh-chevron-open", expanded);

            header.classList.toggle("rh-painel-collapsed", !expanded);

            content.classList.toggle("rh-collapsed", !expanded);
            content.style.maxHeight = expanded ? `${content.scrollHeight}px` : "0px";
        };

        headers.forEach((header) => {
            header.addEventListener("click", () => {
                const content = header.nextElementSibling;
                if (!content) return;

                const isCollapsed = content.classList.contains("rh-collapsed") || content.style.maxHeight === "0px";
                setExpanded(header, content, isCollapsed);
            });
        });

        // Default: all panels start expanded.
        const contents = Util.qa(this.root, ".painel-content");
        contents.forEach((content) => {
            const header = content.previousElementSibling;
            if (!header) return;

            // Expand immediately, and repeat after layout to ensure scrollHeight is correct.
            setExpanded(header, content, true);
            requestAnimationFrame(() => setExpanded(header, content, true));
        });
    }

    setupModalTabs() {
        const modalRec1 = Util.q(this.root, `#modal-recrutamento1${this.suffix}`);
        if (modalRec1) this._setupModalTabs(modalRec1);

        const modalRec2 = Util.q(this.root, `#modal-recrutamento2${this.suffix}`);
        if (modalRec2) this._setupModalTabs(modalRec2);
    }

    setupModalDetails() {
        if (this._detailBtnDelegationBound) return;
        this._detailBtnDelegationBound = true;

        this.root.addEventListener("click", (e) => {
            const btn = e && e.target ? e.target.closest(".detail-btn") : null;
            if (!btn || !this.root.contains(btn)) return;

            const process = this._safeStr(btn.getAttribute("data-process") || btn.dataset.process);
            if (process === "admissao") {
                const doc = this._safeStr(btn.getAttribute("data-documentid") || btn.dataset.documentid);
                this._openAdmissaoDetalhe(doc);
                return;
            }

            if (process === "req1") {
                const doc = this._safeStr(btn.getAttribute("data-documentid") || btn.dataset.documentid);
                this._openRequisicao1Detalhe(doc);
                return;
            }

            if (process === "req2") {
                const doc = this._safeStr(btn.getAttribute("data-documentid") || btn.dataset.documentid);
                this._openRequisicao2Detalhe(doc);
                return;
            }

            if (process === "rec1") {
                const doc = this._safeStr(btn.getAttribute("data-documentid") || btn.dataset.documentid);
                this._openRecrutamento1Detalhe(doc);
                return;
            }

            if (process === "rec2") {
                const doc = this._safeStr(btn.getAttribute("data-documentid") || btn.dataset.documentid);
                this._openRecrutamento2Detalhe(doc);
                return;
            }
        });
    }

    setupModalClose() {
        const modalRec1 = Util.q(this.root, `#modal-recrutamento1${this.suffix}`);
        if (modalRec1) this._bindModalClose(modalRec1, `#close-modal-recrutamento1${this.suffix}`);

        const modalRec2 = Util.q(this.root, `#modal-recrutamento2${this.suffix}`);
        if (modalRec2) this._bindModalClose(modalRec2, `#close-modal-recrutamento2${this.suffix}`);

        const modalAdm = Util.q(this.root, `#modal-admissao${this.suffix}`);
        if (modalAdm) this._bindModalClose(modalAdm, `#close-modal-admissao${this.suffix}`);

        const modalReq1 = Util.q(this.root, `#modal-requisicao1${this.suffix}`);
        if (modalReq1) this._bindModalClose(modalReq1, `#close-modal-requisicao1${this.suffix}`);

        const modalReq2 = Util.q(this.root, `#modal-requisicao2${this.suffix}`);
        if (modalReq2) this._bindModalClose(modalReq2, `#close-modal-requisicao2${this.suffix}`);
    }

    _getRecrutamento1DetalhamentoConfig() {
        try {
            const cfg = window.BEVAP_RH_RECRUTAMENTO1_DETALHAMENTO_CONFIG;
            if (!cfg || !cfg.panels || !Array.isArray(cfg.panels)) return null;
            return cfg;
        } catch (e) {
            return null;
        }
    }

    _ensureRecrutamento1ModalBuilt() {
        if (this._recrutamento1ModalBuilt) return true;

        const cfg = this._getRecrutamento1DetalhamentoConfig();
        const modal = Util.q(this.root, `#modal-recrutamento1${this.suffix}`);
        const tabs = Util.q(this.root, `#modal-recrutamento1-tabs${this.suffix}`);
        const body = Util.q(this.root, `#modal-recrutamento1-body${this.suffix}`);
        if (!cfg || !modal || !tabs || !body) return false;

        const closeBtn = Util.q(tabs, `#close-modal-recrutamento1${this.suffix}`);
        Util.qa(tabs, ".tab-btn").forEach((b) => b.remove());
        body.innerHTML = "";

        this._recrutamento1ModalFieldEls = {};
        this._recrutamento1ModalChildTables = {};

        const makeSafeId = (s) => {
            const v = String(s || "");
            const normalized = typeof v.normalize === "function" ? v.normalize("NFD") : v;
            const cleaned = normalized
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();
            return cleaned ? cleaned : "tab";
        };

        cfg.panels.forEach((panel, idx) => {
            const tabKey = `rec1-${makeSafeId(panel.domId || panel.title || String(idx))}-${idx}`;

            const btn = document.createElement("button");
            btn.className = "tab-btn" + (idx === 0 ? " tab-active" : "");
            btn.setAttribute("data-tab", tabKey);
            btn.textContent = String(panel.title || `Painel ${idx + 1}`);

            if (closeBtn) tabs.insertBefore(btn, closeBtn);
            else tabs.appendChild(btn);

            const tab = document.createElement("div");
            tab.className = "tab-content" + (idx === 0 ? "" : " hidden");
            tab.id = `tab-${tabKey}${this.suffix}`;

            (panel.sections || []).forEach((section) => {
                if (section.type === "section") {
                    const title = this._safeStr(section.title);
                    if (title) {
                        const h = document.createElement("h2");
                        h.className = "rh-modal-section-title";
                        h.textContent = title;
                        tab.appendChild(h);
                    }

                    const grid = document.createElement("div");
                    grid.className = "rh-modal-grid-2";

                    (section.fields || []).forEach((f) => {
                        const fieldId = this._safeStr(f.id);
                        if (!fieldId) return;

                        const wrap = document.createElement("div");
                        const label = document.createElement("label");
                        label.className = "rh-modal-label";
                        label.textContent = this._safeStr(f.label) || fieldId;

                        const input = document.createElement("input");
                        input.type = "text";
                        input.readOnly = true;
                        input.className = "input-modal";
                        input.setAttribute("data-field-id", fieldId);

                        wrap.appendChild(label);
                        wrap.appendChild(input);
                        grid.appendChild(wrap);

                        this._recrutamento1ModalFieldEls[fieldId] = input;
                    });

                    if (grid.childElementCount > 0) tab.appendChild(grid);
                }

                if (section.type === "childTable") {
                    const tableId = this._safeStr(section.tableId);
                    if (!tableId) return;

                    const h = document.createElement("h2");
                    h.className = "rh-modal-section-title";
                    h.textContent = this._safeStr(section.title) || `Tabela Filho: ${tableId}`;
                    tab.appendChild(h);

                    const container = document.createElement("div");
                    container.setAttribute("data-child-table", tableId);
                    tab.appendChild(container);

                    const fields = [];
                    (section.fields || []).forEach((f) => {
                        const key = this._safeStr(f.key);
                        if (!key) return;
                        fields.push({ key, label: this._safeStr(f.label) || key });
                    });

                    this._recrutamento1ModalChildTables[tableId] = { container, fields };
                }
            });

            body.appendChild(tab);
        });

        this._setupModalTabs(modal);

        this._recrutamento1ModalBuilt = true;
        return true;
    }

    _logRecrutamento1Detail(label, payload) {
        try {
            if (payload !== undefined) console.log(`[bevap_gestao_rh][rec1] ${label}`, payload);
            else console.log(`[bevap_gestao_rh][rec1] ${label}`);
        } catch (e) {
            // noop
        }
    }

    _parseMaybeJsonArrayRec1(value) {
        if (Array.isArray(value)) return value;
        const s = this._safeStr(value);
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            this._logRecrutamento1Detail("WARN: JSON inválido em tabela filho", { value: s.slice(0, 200) });
            return [];
        }
    }

    _fetchRecrutamento1Detalhamento(documentid) {
        const cfg = this._getRecrutamento1DetalhamentoConfig();
        if (!cfg) return null;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            return null;
        }

        const doc = this._safeStr(documentid);
        if (!doc) return null;

        this._logRecrutamento1Detail("documentid", doc);
        this._logRecrutamento1Detail("selectFields.count", Array.isArray(cfg.selectFields) ? cfg.selectFields.length : 0);

        const constraints = [];
        let canBuildConstraints = false;
        try {
            if (typeof DatasetFactory.createConstraint === "function" && typeof ConstraintType !== "undefined") {
                constraints.push(DatasetFactory.createConstraint("documentid", doc, doc, ConstraintType.MUST));
                const tableName = String(cfg.baseTable);
                constraints.push(DatasetFactory.createConstraint("tablename", tableName, tableName, ConstraintType.MUST));
                canBuildConstraints = true;
            }
        } catch (e) {
            // noop
        }

        if (!canBuildConstraints) {
            this._logRecrutamento1Detail(
                "WARN: não foi possível criar constraints (DatasetFactory.createConstraint/ConstraintType)"
            );
        } else {
            this._logRecrutamento1Detail("constraints", constraints);
        }

        const datasetName = String(cfg.dataset);

        const callDataset = (cons, label) => {
            let dsLocal = null;
            try {
                const cnt = Array.isArray(cfg.selectFields)
                    ? cfg.selectFields.length
                    : cfg.selectFields == null
                      ? "(null)"
                      : "(?)";
                this._logRecrutamento1Detail(`dataset call ${label}.fields.count`, cnt);
                dsLocal = DatasetFactory.getDataset(datasetName, cfg.selectFields || null, cons, null);
            } catch (e) {
                this._logRecrutamento1Detail(`ERRO DatasetFactory.getDataset (${label})`, e);
                dsLocal = null;
            }
            return dsLocal;
        };

        const ds = callDataset(canBuildConstraints ? constraints : null, "full");
        const values = ds && Array.isArray(ds.values) ? ds.values : [];
        this._logRecrutamento1Detail("dataset.values.length", values.length);

        if (!ds) {
            this._logRecrutamento1Detail("dataset retorno = null");
            return null;
        }

        if (values.length <= 0) {
            this._logRecrutamento1Detail("dataset vazio", ds);
            return null;
        }

        let row = values[0] || null;
        if (!canBuildConstraints) {
            const found = values.find((r) => this._safeStr(r && r.documentid) === doc);
            if (found) row = found;
            this._logRecrutamento1Detail("row (fallback)", row);
        }

        this._logRecrutamento1Detail("row (0)", row);
        return row;
    }

    _resolveRecrutamento1FieldValue(values, fieldId) {
        const id = this._safeStr(fieldId);
        if (!id) return "";
        if (id.indexOf(".") === -1) return values ? values[id] : "";

        const parts = id.split(".");
        const tableId = this._safeStr(parts[0]);
        const lookupKey = parts.slice(1).join(".");
        if (!tableId || !lookupKey) return "";

        const arr = this._parseMaybeJsonArrayRec1(values ? values[tableId] : null);
        if (!arr || arr.length === 0) return "";

        const item = arr.find((it) => it && lookupKey in it);
        return item ? item[lookupKey] : "";
    }

    _fillRecrutamento1Modal(row) {
        const modal = Util.q(this.root, `#modal-recrutamento1${this.suffix}`);
        if (!modal) return;

        const values = row || {};

        const cfg = this._getRecrutamento1DetalhamentoConfig();

        const fieldEls = this._recrutamento1ModalFieldEls || {};
        Object.keys(fieldEls).forEach((fieldId) => {
            const el = fieldEls[fieldId];
            if (!el) return;
            const raw = this._resolveRecrutamento1FieldValue(values, fieldId);
            const mapped = this._mapSelectValueFromConfig(cfg, fieldId, raw, values);
            const v = this._valueOrNA(mapped);
            el.value = v;
            if (v) el.setAttribute("title", String(v));
            else el.removeAttribute("title");
        });

        const tables = this._recrutamento1ModalChildTables || {};
        Object.keys(tables).forEach((tableId) => {
            const def = tables[tableId];
            if (!def || !def.container) return;
            def.container.innerHTML = "";

            const arr = this._parseMaybeJsonArrayRec1(values[tableId]);
            if (!arr || arr.length === 0) {
                const empty = document.createElement("div");
                empty.className = "rh-modal-field";
                empty.textContent = "Nenhum registro";
                def.container.appendChild(empty);
                return;
            }

            arr.forEach((item, idx) => {
                const record = document.createElement("div");
                record.className = "rh-modal-record";

                const recordTitle = document.createElement("label");
                recordTitle.className = "rh-modal-label-bold";
                recordTitle.textContent = `Registro ${idx + 1}`;
                record.appendChild(recordTitle);

                const grid = document.createElement("div");
                grid.className = "rh-modal-grid-2";

                (def.fields || []).forEach((col) => {
                    const wrap = document.createElement("div");
                    const label = document.createElement("label");
                    label.className = "rh-modal-label";
                    label.textContent = this._safeStr(col.label) || this._safeStr(col.key);

                    const input = document.createElement("input");
                    input.type = "text";
                    input.readOnly = true;
                    input.className = "input-modal";

                    const cell = item && col && col.key in item ? item[col.key] : "";
                    const mappedCell = this._mapSelectValueFromConfig(cfg, col.key, cell, item);
                    const txt = this._valueOrNA(mappedCell);
                    input.value = txt;
                    if (txt) input.setAttribute("title", String(txt));

                    wrap.appendChild(label);
                    wrap.appendChild(input);
                    grid.appendChild(wrap);
                });

                record.appendChild(grid);
                def.container.appendChild(record);
            });
        });
    }

    _openRecrutamento1Detalhe(documentid) {
        const modal = Util.q(this.root, `#modal-recrutamento1${this.suffix}`);
        if (!modal) return;

        try {
            console.groupCollapsed(`[bevap_gestao_rh][rec1] detalhe click (documentid=${this._safeStr(documentid)})`);
        } catch (e) {
            // noop
        }

        if (!this._ensureRecrutamento1ModalBuilt()) {
            try {
                console.warn("[bevap_gestao_rh] Não foi possível montar o modal de Recrutamento 1 (config/DOM ausente)");
            } catch (e) {
                // noop
            }

            try {
                console.groupEnd();
            } catch (e) {
                // noop
            }
            return;
        }

        const row = this._fetchRecrutamento1Detalhamento(documentid);
        this._fillRecrutamento1Modal(row);

        const firstBtn = Util.q(modal, ".tab-btn");
        if (firstBtn) firstBtn.click();

        modal.classList.remove("hidden");
        this._updatePageScrollLock();

        try {
            console.groupEnd();
        } catch (e) {
            // noop
        }
    }

    _getRecrutamento2DetalhamentoConfig() {
        try {
            const cfg = window.BEVAP_RH_RECRUTAMENTO2_DETALHAMENTO_CONFIG;
            if (!cfg || !cfg.panels || !Array.isArray(cfg.panels)) return null;
            return cfg;
        } catch (e) {
            return null;
        }
    }

    _ensureRecrutamento2ModalBuilt() {
        if (this._recrutamento2ModalBuilt) return true;

        const cfg = this._getRecrutamento2DetalhamentoConfig();
        const modal = Util.q(this.root, `#modal-recrutamento2${this.suffix}`);
        const tabs = Util.q(this.root, `#modal-recrutamento2-tabs${this.suffix}`);
        const body = Util.q(this.root, `#modal-recrutamento2-body${this.suffix}`);
        if (!cfg || !modal || !tabs || !body) return false;

        const closeBtn = Util.q(tabs, `#close-modal-recrutamento2${this.suffix}`);
        Util.qa(tabs, ".tab-btn").forEach((b) => b.remove());
        body.innerHTML = "";

        this._recrutamento2ModalFieldEls = {};
        this._recrutamento2ModalChildTables = {};

        const makeSafeId = (s) => {
            const v = String(s || "");
            const normalized = typeof v.normalize === "function" ? v.normalize("NFD") : v;
            const cleaned = normalized
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();
            return cleaned ? cleaned : "tab";
        };

        cfg.panels.forEach((panel, idx) => {
            const tabKey = `rec2-${makeSafeId(panel.domId || panel.title || String(idx))}-${idx}`;

            const btn = document.createElement("button");
            btn.className = "tab-btn" + (idx === 0 ? " tab-active" : "");
            btn.setAttribute("data-tab", tabKey);
            btn.textContent = String(panel.title || `Painel ${idx + 1}`);

            if (closeBtn) tabs.insertBefore(btn, closeBtn);
            else tabs.appendChild(btn);

            const tab = document.createElement("div");
            tab.className = "tab-content" + (idx === 0 ? "" : " hidden");
            tab.id = `tab-${tabKey}${this.suffix}`;

            (panel.sections || []).forEach((section) => {
                if (section.type === "section") {
                    const title = this._safeStr(section.title);
                    if (title) {
                        const h = document.createElement("h2");
                        h.className = "rh-modal-section-title";
                        h.textContent = title;
                        tab.appendChild(h);
                    }

                    const grid = document.createElement("div");
                    grid.className = "rh-modal-grid-2";

                    (section.fields || []).forEach((f) => {
                        const fieldId = this._safeStr(f.id);
                        if (!fieldId) return;

                        const wrap = document.createElement("div");
                        const label = document.createElement("label");
                        label.className = "rh-modal-label";
                        label.textContent = this._safeStr(f.label) || fieldId;

                        const input = document.createElement("input");
                        input.type = "text";
                        input.readOnly = true;
                        input.className = "input-modal";
                        input.setAttribute("data-field-id", fieldId);

                        wrap.appendChild(label);
                        wrap.appendChild(input);
                        grid.appendChild(wrap);

                        this._recrutamento2ModalFieldEls[fieldId] = input;
                    });

                    if (grid.childElementCount > 0) tab.appendChild(grid);
                }

                if (section.type === "childTable") {
                    const tableId = this._safeStr(section.tableId);
                    if (!tableId) return;

                    const h = document.createElement("h2");
                    h.className = "rh-modal-section-title";
                    h.textContent = this._safeStr(section.title) || `Tabela Filho: ${tableId}`;
                    tab.appendChild(h);

                    const container = document.createElement("div");
                    container.setAttribute("data-child-table", tableId);
                    tab.appendChild(container);

                    const fields = [];
                    (section.fields || []).forEach((f) => {
                        const key = this._safeStr(f.key);
                        if (!key) return;
                        fields.push({ key, label: this._safeStr(f.label) || key });
                    });

                    this._recrutamento2ModalChildTables[tableId] = { container, fields };
                }
            });

            body.appendChild(tab);
        });

        this._setupModalTabs(modal);

        this._recrutamento2ModalBuilt = true;
        return true;
    }

    _logRecrutamento2Detail(label, payload) {
        try {
            if (payload !== undefined) console.log(`[bevap_gestao_rh][rec2] ${label}`, payload);
            else console.log(`[bevap_gestao_rh][rec2] ${label}`);
        } catch (e) {
            // noop
        }
    }

    _parseMaybeJsonArrayRec2(value) {
        if (Array.isArray(value)) return value;
        const s = this._safeStr(value);
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            this._logRecrutamento2Detail("WARN: JSON inválido em tabela filho", { value: s.slice(0, 200) });
            return [];
        }
    }

    _fetchRecrutamento2Detalhamento(documentid) {
        const cfg = this._getRecrutamento2DetalhamentoConfig();
        if (!cfg) return null;

        if (typeof DatasetFactory === "undefined" || typeof DatasetFactory.getDataset !== "function") {
            return null;
        }

        const doc = this._safeStr(documentid);
        if (!doc) return null;

        this._logRecrutamento2Detail("documentid", doc);
        this._logRecrutamento2Detail("selectFields.count", Array.isArray(cfg.selectFields) ? cfg.selectFields.length : 0);

        const constraints = [];
        let canBuildConstraints = false;
        try {
            if (typeof DatasetFactory.createConstraint === "function" && typeof ConstraintType !== "undefined") {
                constraints.push(DatasetFactory.createConstraint("documentid", doc, doc, ConstraintType.MUST));
                const tableName = String(cfg.baseTable);
                constraints.push(DatasetFactory.createConstraint("tablename", tableName, tableName, ConstraintType.MUST));
                canBuildConstraints = true;
            }
        } catch (e) {
            // noop
        }

        if (!canBuildConstraints) {
            this._logRecrutamento2Detail(
                "WARN: não foi possível criar constraints (DatasetFactory.createConstraint/ConstraintType)"
            );
        } else {
            this._logRecrutamento2Detail("constraints", constraints);
        }

        const datasetName = String(cfg.dataset);

        const callDataset = (cons, label) => {
            let dsLocal = null;
            try {
                const cnt = Array.isArray(cfg.selectFields)
                    ? cfg.selectFields.length
                    : cfg.selectFields == null
                      ? "(null)"
                      : "(?)";
                this._logRecrutamento2Detail(`dataset call ${label}.fields.count`, cnt);
                dsLocal = DatasetFactory.getDataset(datasetName, cfg.selectFields || null, cons, null);
            } catch (e) {
                this._logRecrutamento2Detail(`ERRO DatasetFactory.getDataset (${label})`, e);
                dsLocal = null;
            }
            return dsLocal;
        };

        const ds = callDataset(canBuildConstraints ? constraints : null, "full");
        const values = ds && Array.isArray(ds.values) ? ds.values : [];
        this._logRecrutamento2Detail("dataset.values.length", values.length);

        if (!ds) {
            this._logRecrutamento2Detail("dataset retorno = null");
            return null;
        }

        if (values.length <= 0) {
            this._logRecrutamento2Detail("dataset vazio", ds);
            return null;
        }

        let row = values[0] || null;
        if (!canBuildConstraints) {
            const found = values.find((r) => this._safeStr(r && r.documentid) === doc);
            if (found) row = found;
            this._logRecrutamento2Detail("row (fallback)", row);
        }

        this._logRecrutamento2Detail("row (0)", row);
        return row;
    }

    _resolveRecrutamento2FieldValue(values, fieldId) {
        const id = this._safeStr(fieldId);
        if (!id) return "";
        if (id.indexOf(".") === -1) return values ? values[id] : "";

        const parts = id.split(".");
        const tableId = this._safeStr(parts[0]);
        const lookupKey = parts.slice(1).join(".");
        if (!tableId || !lookupKey) return "";

        const arr = this._parseMaybeJsonArrayRec2(values ? values[tableId] : null);
        if (!arr || arr.length === 0) return "";

        const item = arr.find((it) => it && lookupKey in it);
        return item ? item[lookupKey] : "";
    }

    _fillRecrutamento2Modal(row) {
        const modal = Util.q(this.root, `#modal-recrutamento2${this.suffix}`);
        if (!modal) return;

        const values = row || {};

        const cfg = this._getRecrutamento2DetalhamentoConfig();

        const fieldEls = this._recrutamento2ModalFieldEls || {};
        Object.keys(fieldEls).forEach((fieldId) => {
            const el = fieldEls[fieldId];
            if (!el) return;
            const raw = this._resolveRecrutamento2FieldValue(values, fieldId);
            const mapped = this._mapSelectValueFromConfig(cfg, fieldId, raw, values);
            const v = this._valueOrNA(mapped);
            el.value = v;
            if (v) el.setAttribute("title", String(v));
            else el.removeAttribute("title");
        });

        const tables = this._recrutamento2ModalChildTables || {};
        Object.keys(tables).forEach((tableId) => {
            const def = tables[tableId];
            if (!def || !def.container) return;
            def.container.innerHTML = "";

            const arr = this._parseMaybeJsonArrayRec2(values[tableId]);
            if (!arr || arr.length === 0) {
                const empty = document.createElement("div");
                empty.className = "rh-modal-field";
                empty.textContent = "Nenhum registro";
                def.container.appendChild(empty);
                return;
            }

            arr.forEach((item, idx) => {
                const record = document.createElement("div");
                record.className = "rh-modal-record";

                const recordTitle = document.createElement("label");
                recordTitle.className = "rh-modal-label-bold";
                recordTitle.textContent = `Registro ${idx + 1}`;
                record.appendChild(recordTitle);

                const grid = document.createElement("div");
                grid.className = "rh-modal-grid-2";

                (def.fields || []).forEach((col) => {
                    const wrap = document.createElement("div");
                    const label = document.createElement("label");
                    label.className = "rh-modal-label";
                    label.textContent = this._safeStr(col.label) || this._safeStr(col.key);

                    const input = document.createElement("input");
                    input.type = "text";
                    input.readOnly = true;
                    input.className = "input-modal";

                    const cell = item && col && col.key in item ? item[col.key] : "";
                    const mappedCell = this._mapSelectValueFromConfig(cfg, col.key, cell, item);
                    const txt = this._valueOrNA(mappedCell);
                    input.value = txt;
                    if (txt) input.setAttribute("title", String(txt));

                    wrap.appendChild(label);
                    wrap.appendChild(input);
                    grid.appendChild(wrap);
                });

                record.appendChild(grid);
                def.container.appendChild(record);
            });
        });
    }

    _openRecrutamento2Detalhe(documentid) {
        const modal = Util.q(this.root, `#modal-recrutamento2${this.suffix}`);
        if (!modal) return;

        try {
            console.groupCollapsed(`[bevap_gestao_rh][rec2] detalhe click (documentid=${this._safeStr(documentid)})`);
        } catch (e) {
            // noop
        }

        if (!this._ensureRecrutamento2ModalBuilt()) {
            try {
                console.warn("[bevap_gestao_rh] Não foi possível montar o modal de Recrutamento 2 (config/DOM ausente)");
            } catch (e) {
                // noop
            }

            try {
                console.groupEnd();
            } catch (e) {
                // noop
            }
            return;
        }

        const row = this._fetchRecrutamento2Detalhamento(documentid);
        this._fillRecrutamento2Modal(row);

        const firstBtn = Util.q(modal, ".tab-btn");
        if (firstBtn) firstBtn.click();

        modal.classList.remove("hidden");
        this._updatePageScrollLock();

        try {
            console.groupEnd();
        } catch (e) {
            // noop
        }
    }
}
