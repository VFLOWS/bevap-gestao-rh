function beforeTaskSave(colleagueId, nextSequenceId, userList) {

  switch (parseInt(nextSequenceId, 10)) {
    case 27:
    case 49:
      hAPI.setCardValue("aprovado", false)
      break;
    case 71:
      hAPI.setCardValue("aprovado", true)
      break;
  }
}