
window.BEVAP_RH_REQUISICAO1_DETALHAMENTO_CONFIG = {
  // Dataset SQL (dinâmico) que consegue trazer campos pai + JSON das tabelas filho.
  // Mesmo dataset usado na Admissão.
  dataset: "ds_rastreabilidade_RH_detalhamento",

  // IMPORTANT: este dataset filtra por "tablename" (ex.: "ML001351" na Admissão).
  // Requisição 1 (form 90987): ML00190987
  baseTable: "ML001298",

  // Campos que o dataset deve selecionar.
  // IMPORTANTE: não listar campos de tabelas filho aqui.
  // As tabelas filho já vêm no retorno do dataset em formato JSON.
  // Importante: manter essa lista enxuta ajuda performance.
  selectFields: [
    // Identificação
    "tipoVaga",
    "cargo",
    "areaReq",
    "localTrabalho",
    "numVagas",
    "centroCusto",
    "horarioTrabalho",
    "motivo",
    "faixasalarialDe",
    "faixasalarialDeAte",
    "previstoPatch",
    "nivelAprovacao",
    "observacao",

    // Requisitos da vaga
    "formacaoCandidato",
    "instrucaoCandidato",
    "usaItensTi",
    "impressao",
    "perfilPadrao",
    "email",

    // Integração
    "dados_nomeSolicitante",
    "dataEnvio",
    "dados_numFluig",
  ],
  

  // Mapeamento de campos <select>: value retornado no dataset -> texto exibido no formulário.
  // Obs.: manter apenas combos com opções fixas no HTML do formulário.
  valueMaps: {
    motivo: { "": "Selecione ...", "1": "Aumento de quadro", "2": "Substituição" },
    previstoPatch: { "": "Selecione...", "1": "Sim", "2": "Não" },
    nivelAprovacao: {
      "": "Selecione...",
      Aprendiz: "Aprendiz",
      "Presidência": "Presidência",
      Encarregados: "Encarregados",
      "Gestores Executivos": "Gestores Executivos",
      "Gestores Operacionais": "Gestores Operacionais",
      "Líderes": "Líderes",
      Operacionais: "Operacionais",
      Supervisores: "Supervisores"
    },
    impressao: { "": "Selecione...", "1": "Preto e Branco", "2": "Colorida" },
    instrucaoCandidato: { "": "Selecione ...", B: "Básico", M: "Médio", S: "Superior", P: "Pós Graduação" },

    // Campos da tabela de candidatos (childTable)
    instrucao: { "": "Selecione ...", B: "Básico", M: "Médio", S: "Superior", P: "Pós Graduação" },
    origemCandidato: { interno: "Interno", externo: "Externo" },

    // Mesmo padrão usado no formulário
    acessoInternet: { "": "Selecione...", "1": "Parcial", "2": "Total", "3": "Sem acesso" }
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
            { id: "tipoVaga", label: "Leed Time de contratação" },
            { id: "cargo", label: "Cargo" },
            { id: "areaReq", label: "Seção" },
            { id: "localTrabalho", label: "Departamento" },
            { id: "numVagas", label: "Número de vagas" },
            { id: "centroCusto", label: "Centro de custo" },
            { id: "horarioTrabalho", label: "Horário de trabalho" },
            { id: "motivo", label: "Motivo" },
            { id: "faixasalarialDe", label: "Faixa salarial (De)" },
            { id: "faixasalarialDeAte", label: "Faixa salarial (Até)" },
            { id: "previstoPatch", label: "Previsto PEF" },
            { id: "nivelAprovacao", label: "Nível de aprovação" },
            { id: "observacao", label: "Observações" }
          ]
        }
      ],
      childTables: {}
    },

    {
      title: "Requisitos da Vaga",
      domId: "painelRequisitosVaga",
      sections: [
        {
          type: "section",
          title: "Formação",
          fields: [
            { id: "formacaoCandidato", label: "Formação" },
            { id: "instrucaoCandidato", label: "Grau de instrução" }
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
          title: "Tarefas a serem desempenhadas",
          tableId: "tabelaTarefas",
          fields: [{ key: "tarefas", label: "Tarefas" }]
        }
      ],
      childTables: {}
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
          fields: [{ key: "habilidades", label: "Habilidades necessárias" }]
        }
      ],
      childTables: {}
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
          fields: [{ key: "treinamento", label: "Treinamentos" }]
        }
      ],
      childTables: {}
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
            { id: "impressao", label: "Impressão" },
            { id: "perfilPadrao", label: "Perfil padrão" },
            { id: "email", label: "Email" }
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
        }
      ],
      childTables: {}
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
      ],
      childTables: {}
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
            { id: "dataEnvio", label: "Data da solicitação" },
            { id: "dados_numFluig", label: "Nº Fluig" }
          ]
        }
      ],
      childTables: {}
    }
  ]
};
