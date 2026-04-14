
// Config do modal dinâmico de detalhamento - Recrutamento 1
// Observação: não listar campos de tabelas filho no selectFields.
// As tabelas filho já vêm no retorno do dataset em formato JSON (mesmo padrão da Admissão/Requisições).

window.BEVAP_RH_RECRUTAMENTO1_DETALHAMENTO_CONFIG = {
  dataset: "ds_rastreabilidade_RH_detalhamento",

  // IMPORTANT: este dataset filtra por "tablename" (ex.: "ML001351" na Admissão).
  // Form de referência (export): 90988 - Recrutamento e seleção
  // Se o COD_LISTA do formulário for diferente no ambiente, ajuste aqui.
  baseTable: "ML001309",

  // Apenas campos do pai (as tabelas filho vêm como JSON no retorno).
  selectFields: [
    // Identificação
    "cargo",
    "origem",
    "solicitante",
    "candidato",
    "tipoVaga",
    "numProcessoReqPessoal",

    // Validações / interno
    "escolaridadeExigida",
    "permanenciaInterna",
    "salarioMenor",

    // Links
    "linkSolicitacaoReq",
    "linkReqPessoal2",

    // Comentários / Paralisação
    "observacao",
    "paralizarSolic",
    "dataInicioParalizacao",
    "dataFimParalizacao",

    // Avaliação Técnica
    "comentariosRecursos",
    "candidatoAprovado",
    "parecer",

    // Avaliação Comportamental
    "comentariosAvalTec",
    "parecerTecnico",
    "aprovAvaliacaoComport",
    "obsAvaliaComport",

    // Aprovação
    "aprovParecerRh",
    "parecerRh",
    "aprovParecerLideranca",
    "parecerLideranca"
  ],

  // Mapeamento de campos <select>: value retornado no dataset -> texto exibido no formulário.
  valueMaps: {
    escolaridadeExigida: { "": "Selecione", sim: "Sim", nao: "Não" },
    permanenciaInterna: { "": "Selecione", sim: "Sim", nao: "Não" },
    salarioMenor: { "": "Selecione", sim: "Sim", nao: "Não" },
    paralizarSolic: { "": "Selecione", sim: "Sim", nao: "Não" },
    candidatoAprovado: { "": "Selecione", sim: "Sim", nao: "Não" },
    aprovAvaliacaoComport: { "": "Selecione", sim: "Sim", nao: "Não" },
    aprovParecerRh: { "": "Selecione", sim: "Sim", nao: "Não" },
    aprovParecerLideranca: { "": "Selecione", sim: "Sim", nao: "Não" }
  },

  panels: [
    {
      title: "Identificação",
      domId: "painelSintegra",
      sections: [
        {
          type: "section",
          title: null,
          fields: [
            { id: "cargo", label: "Cargo" },
            { id: "origem", label: "Origem" },
            { id: "solicitante", label: "Solicitante" },
            { id: "candidato", label: "Candidato" },
            { id: "tipoVaga", label: "Tipo da vaga" },
            { id: "numProcessoReqPessoal", label: "Número processo Requisição pessoal" }
          ],
        },
        {
          type: "section",
          title: null,
          fields: [
            { id: "escolaridadeExigida", label: "Escolaridade igual ou elevada a exigida" },
            { id: "permanenciaInterna", label: "Permanência interna 6 meses" },
            { id: "salarioMenor", label: "Salário menor ou igual a vaga" }
          ],
        },
        {
          type: "section",
          title: null,
          fields: [
            { id: "linkSolicitacaoReq", label: "Link Solicitação Requisição Pessoal" },
            { id: "linkReqPessoal2", label: "Link retorno Solicitação Requisição Pessoal" }
          ],
        },
        {
          type: "section",
          title: null,
          fields: [
            { id: "observacao", label: "Comentários" },
            { id: "paralizarSolic", label: "Paralizar solicitação" },
            { id: "dataInicioParalizacao", label: "Data início paralisação" },
            { id: "dataFimParalizacao", label: "Data fim paralisação" }
          ],
        }
      ],
    },

    {
      title: "Avaliação Técnica",
      domId: "painelAvaliacaoTecnica",
      sections: [
        {
          type: "childTable",
          title: "Recursos utilizados",
          tableId: "tabelaFormacao",
          fields: [{ key: "recursos", label: "Recursos" }]
        },
        {
          type: "section",
          title: null,
          fields: [
            { id: "comentariosRecursos", label: "Comentários" },
            { id: "candidatoAprovado", label: "Candidato aprovado" },
            { id: "parecer", label: "Parecer" }
          ],
        }
      ],
    },

    {
      title: "Avaliação Comportamental",
      domId: "painelAvaliaComportamental",
      sections: [
        {
          type: "childTable",
          title: "Testes utilizados",
          tableId: "caracteristicasPessoais",
          fields: [{ key: "caracteristicasPessoais", label: "Testes utilizados" }]
        },
        {
          type: "section",
          title: null,
          fields: [
            { id: "comentariosAvalTec", label: "Comentários" },
            { id: "parecerTecnico", label: "Parecer" }
          ],
        },
        {
          type: "section",
          title: "Aprovação (se aplicável)",
          fields: [
            { id: "aprovAvaliacaoComport", label: "Aprovado" },
            { id: "obsAvaliaComport", label: "Observações" }
          ],
        }
      ],
    },

    {
      title: "Aprovação",
      domId: "painelSst",
      sections: [
        {
          type: "section",
          title: "Parecer RH",
          fields: [
            { id: "aprovParecerRh", label: "Parecer de contratação (RH)" },
            { id: "parecerRh", label: "Observações (RH)" }
          ],
        },
        {
          type: "section",
          title: "Parecer Liderança",
          fields: [
            { id: "aprovParecerLideranca", label: "Parecer de contratação (Liderança)" },
            { id: "parecerLideranca", label: "Observações (Liderança)" }
          ],
        }
      ],
    }
  ],
};
