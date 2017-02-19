
//for registering stickers
function onAfterCaptureScan(event)  {

  //alert(event.value);

  document.getElementById('registerStickerVariableHolder').value = event.value;
  document.getElementById('scanBtn').style.display = "none";

}


//for joining Games
function onAfterCaptureScanJoinGame(event)  {

  //alert(event.value);

  document.getElementById('JoinGameVariableHolder').value = event.value;

}

function onAfterCaptureScanCurrentGame(event)  {

  //alert(event.value);

  document.getElementById('CurrentGameVariableHolder').value = event.value;

}

function onAfterGetGeolocation(event)  {

  alert(event);



}
