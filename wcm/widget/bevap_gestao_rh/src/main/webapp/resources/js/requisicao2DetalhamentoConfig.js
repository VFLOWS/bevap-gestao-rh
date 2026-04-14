
// Config do modal dinâmico de detalhamento - Requisição de Pessoal Parte 2
// Observação: não listar campos de tabelas filho no selectFields.
// As tabelas filho já vêm no retorno do dataset em formato JSON (mesmo padrão da Admissão).

window.BEVAP_RH_REQUISICAO2_DETALHAMENTO_CONFIG = {
  dataset: "ds_rastreabilidade_RH_detalhamento",

  // IMPORTANT: este dataset filtra por "tablename" (ex.: "ML001351" na Admissão).
  // Se o COD_LISTA do formulário for diferente, ajuste aqui.
  baseTable: "ML001284",

  // Apenas campos do pai (as tabelas filho vêm como JSON no retorno).
  selectFields: [
    // Identificação
    "nomeCandidatoEscolhido",
    "cargo",
    "areaReq",
    "dataEnvio",
    "numVagas",
    "centroCusto",
    "horarioTrabalho",
    "localTrabalho",
    "motivo",
    "tipoVaga",
    "observacao",

    // TAI
    "usaItensTi",
    "acessoInternet",
    "impressao",
    "perfilPadrao",
    "email",

    // Integração
    "dados_nomeSolicitante",
    "dados_dataSolicitacao",
    "dados_numFluig"
  ],

  // Mapeamento de campos <select>: value retornado no dataset -> texto exibido no formulário.
  valueMaps: {
    motivo: { "": "Selecione ...", "1": "Aumento de quadro", "2": "Substituição" },
    acessoInternet: { "": "Selecione...", "1": "Parcial", "2": "Total", "3": "Sem acesso" },
    impressao: { "": "Selecione...", "1": "Preto e Branco", "2": "Colorida" },
    instrucao: { "": "Selecione ...", B: "Básico", M: "Médio", S: "Superior", P: "Pós Graduação" }
  },

  panels: [
    {
      title: "Identificação",
      domId: "painelIdentificacao",
      sections: [
        {
          type: "section",
          title: "Identificação",
          fields: [
            { id: "nomeCandidatoEscolhido", label: "Nome do candidato" },
            { id: "cargo", label: "Cargo" },
            { id: "areaReq", label: "Seção" },
            { id: "dataEnvio", label: "Data" },
            { id: "numVagas", label: "Número de vagas" },
            { id: "centroCusto", label: "Centro de custo" },
            { id: "horarioTrabalho", label: "Horário de trabalho" },
            { id: "localTrabalho", label: "Departamento" },
            { id: "motivo", label: "Motivo" },
            { id: "tipoVaga", label: "Tipo de vaga" },
            { id: "observacao", label: "Observações" }
          ]
        }
      ]
    },

    {
      title: "Requisitos da Vaga",
      domId: "painelRequisitosVaga",
      sections: [
        {
          type: "childTable",
          title: "Formação",
          tableId: "tabelaFormacao",
          fields: [
            { key: "formacao", label: "Formação" },
            { key: "instrucao", label: "Grau de instrução" }
          ]
        },
        {
          type: "childTable",
          title: "Características do trabalho",
          tableId: "caracteristicasTrabalho",
          fields: [{ key: "caracteristicas", label: "Características do trabalho" }]
        },
        {
          type: "childTable",
          title: "Supervisão exercida",
          tableId: "tabelaSupervisao",
          fields: [{ key: "supervisao", label: "Supervisão" }]
        }
      ]
    },

    {
      title: "Requisitos Pessoais",
      domId: "painelRequisitosPessoais",
      sections: [
        {
          type: "childTable",
          title: "Características pessoais",
          tableId: "caracteristicasPessoais",
          fields: [{ key: "caracteristicasPessoais", label: "Características pessoais" }]
        },
        {
          type: "childTable",
          title: "Habilidades necessárias",
          tableId: "tabelaHabilidades",
          fields: [{ key: "habilidades", label: "Habilidades" }]
        },
        {
          type: "childTable",
          title: "Tarefas a serem desempenhadas",
          tableId: "tabelaTarefasDesempenho",
          fields: [{ key: "tarefasDesempenho", label: "Tarefas" }]
        }
      ]
    },

    {
      title: "SST",
      domId: "painelSst",
      sections: [
        {
          type: "childTable",
          title: "EPI",
          tableId: "tabelaEpi",
          fields: [{ key: "epi", label: "EPI" }]
        },
        {
          type: "childTable",
          title: "Treinamentos",
          tableId: "tabelaTreinamentos",
          fields: [{ key: "treinamento", label: "Treinamento" }]
        }
      ]
    },

    {
      title: "TAI",
      domId: "painelTai",
      sections: [
        {
          type: "section",
          title: "TAI",
          fields: [
            { id: "usaItensTi", label: "Usa itens de TI" },
            { id: "acessoInternet", label: "Acesso a internet" },
            { id: "impressao", label: "Impressão" },
            { id: "perfilPadrao", label: "Perfil padrão" },
            { id: "email", label: "E-mail" }
          ]
        },
        {
          type: "childTable",
          title: "Equipamentos",
          tableId: "tableEquipamento",
          fields: [{ key: "equipamentos", label: "Equipamentos" }]
        },
        {
          type: "childTable",
          title: "Licenças",
          tableId: "tabelaLicensas",
          fields: [{ key: "licensas", label: "Licenças" }]
        },
        {
          type: "childTable",
          title: "Características pessoais",
          tableId: "tabelaCaracteristicas2",
          fields: [{ key: "caracPessoais", label: "Características pessoais" }]
        }
      ]
    },

    {
      title: "Recrutamento",
      domId: "painelRecrutamento",
      sections: [
        {
          type: "childTable",
          title: "Candidatos",
          tableId: "tabelaRecrutamento",
          fields: [
            { key: "nomeCandidato", label: "Nome candidato" },
            { key: "cpfCandidato", label: "CPF" },
            { key: "rgCandidato", label: "RG" },
            { key: "dataNascimentoCandidato", label: "Data nascimento" },
            { key: "naturalidadeCandidato", label: "Naturalidade" },
            { key: "formacao", label: "Formação" },
            { key: "instrucao", label: "Grau instrução" },
            { key: "origemCandidato", label: "Origem" }
          ]
        }
      ]
    },

    {
      title: "Integração",
      domId: "painelIntegracao",
      sections: [
        {
          type: "section",
          title: "Integração",
          fields: [
            { id: "dados_nomeSolicitante", label: "Nome do solicitante" },
            { id: "dados_dataSolicitacao", label: "Data da solicitação" },
            { id: "dados_numFluig", label: "Nº Fluig" }
          ]
        }
      ]
    }
  ]
};
