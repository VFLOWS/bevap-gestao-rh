<div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide"
    data-params="MyWidget.instance()" style="display:block;visibility:visible;opacity:1;">
    <div class="bevap-rh-root" style="display:block;visibility:visible;opacity:1;">

    <div class="panel panel-primary fs-color-white" style="background-color: #34558b;">
		<div class="panel-body">
			<div class="row">
				<div class="col-md-12 col-xs-12">
					<h2 id="titulo" class="fs-txt-center">
						<b>Painel de Rastreabilidade - Processos de RH</b>
					</h2>
				</div>
			</div>
		</div>
	</div>


       

        <main id="bevap-rh-main-${instanceId}" class="rh-main">
            <div class="rh-content">

                <section id="bevap-rh-filters-${instanceId}" class="rh-filters">
                    <h2 class="rh-filters-title">Filtros</h2>
                    <div class="rh-filters-grid">
                        <div>
                            <label class="rh-filter-label">Processo</label>
                            <select id="filtro-processo-${instanceId}" class="rh-filter-input">
                                <option>Todos os Processos</option>
                                <option>Admissão</option>
                                <option>Requisição de Pessoal Parte 1</option>
                                <option>Requisição de Pessoal Parte 2</option>
                                <option>Recrutamento e Seleção Parte 1</option>
                                <option>Recrutamento e Seleção Parte 2</option>
                            </select>
                        </div>
                        <div>
                            <label class="rh-filter-label">Status</label>
                            <select id="filtro-status-${instanceId}" class="rh-filter-input">
                                <option>Todos os Status</option>
                                <option>Em Andamento</option>
                                <option>Encerrado</option>
                                <option>Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <label class="rh-filter-label">Período</label>
                            <input id="filtro-periodo-${instanceId}" type="date" class="rh-filter-input">
                        </div>
                        <div>
                            <label class="rh-filter-label">Solicitante</label>
                            <input id="filtro-solicitante-${instanceId}" type="text" placeholder="Digite o nome" class="rh-filter-input">
                        </div>
                    </div>
                    <div class="rh-filters-actions">
                        <button id="btn-filtrar-${instanceId}" class="rh-btn-primary">
                            <i class="fa-solid fa-filter rh-btn-icon"></i>Filtrar
                        </button>
                        <button id="btn-limpar-${instanceId}" class="rh-btn-outline">Limpar</button>
                    </div>
                </section>

                <!-- ===================== ADMISSÃO ===================== -->
                <section id="bevap-rh-admissao-${instanceId}" class="rh-section">
                    <div class="painel-header">
                        <h3 class="rh-painel-title">Admissão</h3>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="painel-content">
                        <div class="rh-table-filter">
                            <label for="filtro-adm-${instanceId}" class="rh-table-filter-label">Filtrar</label>
                            <input type="text" id="filtro-adm-${instanceId}" placeholder="Digite para buscar"
                                class="rh-table-filter-input">
                        </div>
                        <div class="rh-table-wrap">
                            <table class="rh-table" id="tabela-adm-${instanceId}">
                                <thead class="rh-thead">
                                    <tr>
                                        <th class="rh-th col-md-1">ID Fluig</th>
                                        <th class="rh-th col-md-2">Solicitante</th>
                                        <th class="rh-th col-md-1">Status</th>
                                        <th class="rh-th col-md-1">Localização</th>
                                        <th class="rh-th col-md-2">Nome do Candidato</th>
                                        <th class="rh-th col-md-1">CPF</th>
                                        <th class="rh-th col-md-1">Data de Início</th>
                                        <th class="rh-th col-md-2">Responsável</th>
                                        <th class="rh-th col-md-1">Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ===================== REQUISIÇÃO DE PESSOAL PARTE 1 ===================== -->
                <section id="bevap-rh-requisicao-${instanceId}" class="rh-section">
                    <div class="painel-header">
                        <h3 class="rh-painel-title">Requisição de Pessoal Parte 1</h3>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="painel-content">
                        <div class="rh-table-filter">
                            <label for="filtro-req1-${instanceId}" class="rh-table-filter-label">Filtrar</label>
                            <input type="text" id="filtro-req1-${instanceId}" placeholder="Digite para buscar"
                                class="rh-table-filter-input">
                        </div>
                        <div class="rh-table-wrap">
                            <table class="rh-table" id="tabela-req1-${instanceId}">
                                <thead class="rh-thead">
                                    <tr>
                                        <th class="rh-th col-md-1">ID Fluig</th>
                                        <th class="rh-th col-md-1">Solicitante</th>
                                        <th class="rh-th col-md-1">Status</th>
                                        <th class="rh-th col-md-2">Localização</th>
                                        <th class="rh-th col-md-2">Cargo</th>
                                        <th class="rh-th col-md-2">Departamento</th>
                                        <th class="rh-th col-md-1">Vagas</th>
                                        <th class="rh-th col-md-1">Data Solicitação</th>
                                        <th class="rh-th col-md-1">Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ===================== REQUISIÇÃO DE PESSOAL PARTE 2 ===================== -->
                <section id="bevap-rh-requisicao2-${instanceId}" class="rh-section">
                    <div class="painel-header">
                        <h3 class="rh-painel-title">Requisição de Pessoal Parte 2</h3>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="painel-content">
                        <div class="rh-table-filter">
                            <label for="filtro-req2-${instanceId}" class="rh-table-filter-label">Filtrar</label>
                            <input type="text" id="filtro-req2-${instanceId}" placeholder="Digite para buscar"
                                class="rh-table-filter-input">
                        </div>
                        <div class="rh-table-wrap">
                            <table class="rh-table" id="tabela-req2-${instanceId}">
                                <thead class="rh-thead">
                                    <tr>
                                        <th class="rh-th col-md-1">ID Fluig</th>
                                        <th class="rh-th col-md-1">Solicitante</th>
                                        <th class="rh-th col-md-1">Status</th>
                                        <th class="rh-th col-md-2">Localização</th>
                                        <th class="rh-th col-md-2">Cargo</th>
                                        <th class="rh-th col-md-2">Departamento</th>
                                        <th class="rh-th col-md-1">Vagas</th>
                                        <th class="rh-th col-md-1">Data Solicitação</th>
                                        <th class="rh-th col-md-1">Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ===================== RECRUTAMENTO E SELEÇÃO PARTE 1 ===================== -->
                <section id="bevap-rh-recrutamento1-${instanceId}" class="rh-section">
                    <div class="painel-header">
                        <h3 class="rh-painel-title">Recrutamento e Seleção Parte 1</h3>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="painel-content">
                        <div class="rh-table-filter">
                            <label for="filtro-rec1-${instanceId}" class="rh-table-filter-label">Filtrar</label>
                            <input type="text" id="filtro-rec1-${instanceId}" placeholder="Digite para buscar"
                                class="rh-table-filter-input">
                        </div>
                        <div class="rh-table-wrap">
                            <table class="rh-table" id="tabela-rec1-${instanceId}">
                                <thead class="rh-thead">
                                    <tr>
                                        <th class="rh-th col-md-1">ID Fluig</th>
                                        <th class="rh-th col-md-1">Solicitante</th>
                                        <th class="rh-th col-md-1">Status</th>
                                        <th class="rh-th col-md-2">Cargo/Função</th>
                                        <th class="rh-th col-md-2">Candidato</th>
                                        <th class="rh-th col-md-2">Etapa Atual</th>
                                        <th class="rh-th col-md-1">Última Atualização</th>
                                        <th class="rh-th col-md-1">Responsável</th>
                                        <th class="rh-th col-md-1">Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ===================== RECRUTAMENTO E SELEÇÃO PARTE 2 ===================== -->
                <section id="bevap-rh-recrutamento2-${instanceId}" class="rh-section">
                    <div class="painel-header">
                        <h3 class="rh-painel-title">Recrutamento e Seleção Parte 2</h3>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="painel-content">
                        <div class="rh-table-filter">
                            <label for="filtro-rec2-${instanceId}" class="rh-table-filter-label">Filtrar</label>
                            <input type="text" id="filtro-rec2-${instanceId}" placeholder="Digite para buscar"
                                class="rh-table-filter-input">
                        </div>
                        <div class="rh-table-wrap">
                            <table class="rh-table" id="tabela-rec2-${instanceId}">
                                <thead class="rh-thead">
                                    <tr>
                                        <th class="rh-th col-md-1">ID Fluig</th>
                                        <th class="rh-th col-md-1">Solicitante</th>
                                        <th class="rh-th col-md-1">Status</th>
                                        <th class="rh-th col-md-1">Localização</th>
                                        <th class="rh-th col-md-1.25">Cargo/Função</th>
                                        <th class="rh-th col-md-1.25">Candidato</th>
                                        <th class="rh-th col-md-1">Resultado Técnica</th>
                                        <th class="rh-th col-md-1.5">Parecer Final</th>
                                        <th class="rh-th col-md-1">Responsável Técnico</th>
                                        <th class="rh-th col-md-1">Data Fechamento</th>
                                        <th class="rh-th col-md-1">Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ===================== MODAL ADMISSÃO (DETALHAMENTO) ===================== -->
                <div id="modal-admissao-${instanceId}" class="rh-modal hidden">
                    <div class="rh-modal-box">
                        <div class="rh-modal-tabs" id="modal-admissao-tabs-${instanceId}">
                            <button id="close-modal-admissao-${instanceId}" class="rh-modal-close">&times;</button>
                        </div>
                        <div class="rh-modal-body" id="modal-admissao-body-${instanceId}"></div>
                    </div>
                </div>

                <!-- ===================== MODAL REQUISIÇÃO PESSOAL PARTE 1 (DETALHAMENTO) ===================== -->
                <div id="modal-requisicao1-${instanceId}" class="rh-modal hidden">
                    <div class="rh-modal-box">
                        <div class="rh-modal-tabs" id="modal-requisicao1-tabs-${instanceId}">
                            <button id="close-modal-requisicao1-${instanceId}" class="rh-modal-close">&times;</button>
                        </div>
                        <div class="rh-modal-body" id="modal-requisicao1-body-${instanceId}"></div>
                    </div>
                </div>

                <!-- ===================== MODAL REQUISIÇÃO PESSOAL PARTE 2 (DETALHAMENTO) ===================== -->
                <div id="modal-requisicao2-${instanceId}" class="rh-modal hidden">
                    <div class="rh-modal-box">
                        <div class="rh-modal-tabs" id="modal-requisicao2-tabs-${instanceId}">
                            <button id="close-modal-requisicao2-${instanceId}" class="rh-modal-close">&times;</button>
                        </div>
                        <div class="rh-modal-body" id="modal-requisicao2-body-${instanceId}"></div>
                    </div>
                </div>

                <!-- ===================== MODAL RECRUTAMENTO E SELEÇÃO PARTE 1 (DETALHAMENTO) ===================== -->
                <div id="modal-recrutamento1-${instanceId}" class="rh-modal hidden">
                    <div class="rh-modal-box">
                        <div class="rh-modal-tabs" id="modal-recrutamento1-tabs-${instanceId}">
                            <button id="close-modal-recrutamento1-${instanceId}" class="rh-modal-close">&times;</button>
                        </div>
                        <div class="rh-modal-body" id="modal-recrutamento1-body-${instanceId}"></div>
                    </div>
                </div>

                <!-- ===================== MODAL RECRUTAMENTO E SELEÇÃO PARTE 2 (DETALHAMENTO) ===================== -->
                <div id="modal-recrutamento2-${instanceId}" class="rh-modal hidden">
                    <div class="rh-modal-box">
                        <div class="rh-modal-tabs" id="modal-recrutamento2-tabs-${instanceId}">
                            <button id="close-modal-recrutamento2-${instanceId}" class="rh-modal-close">&times;</button>
                        </div>
                        <div class="rh-modal-body" id="modal-recrutamento2-body-${instanceId}"></div>
                    </div>
                </div>

            </div>
        </main>
    </div>
</div>