function beforeTaskSave(colleagueId, nextSequenceId, userList) {

  switch (parseInt(nextSequenceId, 10)) {
    case 14:
      atualizaAprovadores()
      break;
    case 171:
      //validaRecrutamento()
      break;
  }
}