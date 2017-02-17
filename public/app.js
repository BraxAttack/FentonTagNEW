
  var app = angular.module("fentonTagApp", [
    'firebase'
  ]);



  app.factory('Stickers', function($firebaseArray){

    var ref = firebase.database().ref('/Stickers');
    var stickers = $firebaseArray(ref);

    return stickers;
  })

  app.factory('Users', function($firebaseArray, $firebaseObject){

    var usersRef = firebase.database().ref('users');
    var connectedRef = firebase.database().ref('.info/connected');
    var users = $firebaseArray(usersRef);

    var Users = {
      getProfile: function(uid){
        return $firebaseObject(usersRef.child(uid));
      },
      getDisplayName: function(uid){
        return users.$getRecord(uid).displayName;
      },
      all: users
    };

    return Users;
  })

  app.factory('GameInfo', function($firebaseArray, $firebaseObject){

    var gameRef = firebase.database().ref('Games');
    var playersRef = firebase.database().ref('GamePlayers');
    var users = $firebaseArray(gameRef);

    var Game = {
      getGameInfo: function(uid){
        return $firebaseObject(gameRef.child(uid));
      },
      getGameInfoPlayers: function(uid){
        return $firebaseObject(playersRef.child(uid));
      }

    };

    return Game;
  })


  .controller("FentonTagCtrl", function($scope, $interval, $timeout, $firebaseAuth, Stickers, Users, GameInfo) {

/*
VV     VV   AAA   RRRRRR           IIIII NN   NN IIIII TTTTTTT
VV     VV  AAAAA  RR   RR           III  NNN  NN  III    TTT
 VV   VV  AA   AA RRRRRR            III  NN N NN  III    TTT
  VV VV   AAAAAAA RR  RR            III  NN  NNN  III    TTT
   VVV    AA   AA RR   RR          IIIII NN   NN IIIII   TTT

var init
*/


      var FTCtrl = this;

      FTCtrl.signedIn = "";
      FTCtrl.authEmail = "";
      FTCtrl.authPass = "";
      FTCtrl.AllStickers = Stickers;
      FTCtrl.lookupLatLngOnlyOnceVar = "none";
      FTCtrl.playRadius = .4;
      FTCtrl.gameType = "";
      FTCtrl.gameDurr = "15";
      FTCtrl.GameTypes = [
        'Hunters and Gatherers',
        'Grab & GO',
        'Other'

      ]
      FTCtrl.gameType = FTCtrl.GameTypes[0];
      //currentUser is set in the AUTH section
      FTCtrl.currentUser = "";
      FTCtrl.currentUserUserList = {};
      FTCtrl.users = Users;
      FTCtrl.setDisplayNameVar = "";
      FTCtrl.GameName = "Game (real original...)"
      FTCtrl.getGameInfoVar = GameInfo;
      FTCtrl.whichQR = "";
      FTCtrl.StickerCooldownTime = 120000;
/*
      $interval(function () {
        console.log(FTCtrl.currentUser);
      }, 100);
*/
/*
RRRRRR   OOOOO  UU   UU TTTTTTT IIIII NN   NN   GGGG
RR   RR OO   OO UU   UU   TTT    III  NNN  NN  GG  GG
RRRRRR  OO   OO UU   UU   TTT    III  NN N NN GG
RR  RR  OO   OO UU   UU   TTT    III  NN  NNN GG   GG
RR   RR  OOOO0   UUUUU    TTT   IIIII NN   NN  GGGGGG

routing
*/

      //default routes to homepage on controller load
      //FTCtrl.pageRouter = "landingPage";

      FTCtrl.setPageRouter = function(location) {
          FTCtrl.pageRouter = location;

      };


/*
  AAA   UU   UU TTTTTTT HH   HH
 AAAAA  UU   UU   TTT   HH   HH
AA   AA UU   UU   TTT   HHHHHHH
AAAAAAA UU   UU   TTT   HH   HH
AA   AA  UUUUU    TTT   HH   HH

AUTH
*/

      FTCtrl.authSignInWEmailPass = function() {
        var auth = firebase.auth();
        var email = FTCtrl.authEmail;
        var password = FTCtrl.authPass;
        var promise = auth.signInWithEmailAndPassword(email, password);
        promise.catch(function(e) {
          alert(e.message);
        });

      }

      FTCtrl.authGoogle = function() {
        console.log("google");
        var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).then(function(auth) {


      }).catch(function(error) {

        alert(error);
      });





      }

      FTCtrl.authRegisterWithEmailPass = function() {
        var auth = $firebaseAuth();
        var email = FTCtrl.registerEmail;
        var password = FTCtrl.registerPass;
        var promise = auth.$createUserWithEmailAndPassword(email, password);
        promise.catch(function(e) {
          alert(e.message);
          FTCtrl.registerEmail = "";
          FTCtrl.registerPass =""
        });

      }




      FTCtrl.logOut = function() {
        firebase.auth().signOut();
        FTCtrl.signedIn = 'false';
        FTCtrl.currentUser = "";
        FTCtrl.setDisplayNameVar = "";
        FTCtrl.pageRouter = null;
        $scope.$apply();
      };



      firebase.auth().onAuthStateChanged(firebaseUser => {
        if(firebaseUser) {
          console.log(firebaseUser);
          FTCtrl.signedIn = 'true';
          FTCtrl.currentUser = firebaseUser;
          console.log(FTCtrl.currentUser.uid);
          FTCtrl.users.getProfile(FTCtrl.currentUser.uid).$loaded().then(function (profile){
            if(profile.displayName){
              //return profile;
              FTCtrl.currentUserUserList = profile;
            } else {
              FTCtrl.pageRouter = "profileEdit";

            }
          });

          FTCtrl.pageRouter = "landingPage";
          if(true) {

          }
          $scope.$apply();
        } else {
          console.log('not logged in');
          FTCtrl.signedIn = 'false';
          FTCtrl.currentUser = "";
          FTCtrl.pageRouter = null;
          $scope.$apply();
        }
      })

/*
PPPPPP  RRRRRR   OOOOO  FFFFFFF IIIII LL      EEEEEEE
PP   PP RR   RR OO   OO FF       III  LL      EE
PPPPPP  RRRRRR  OO   OO FFFF     III  LL      EEEEE
PP      RR  RR  OO   OO FF       III  LL      EE
PP      RR   RR  OOOO0  FF      IIIII LLLLLLL EEEEEEE

PROFILE
*/

  FTCtrl.setDisplayName = function() {
    console.log("fired");
    var profileUpdates = {};
    var profileData = FTCtrl.setDisplayNameVar;


    profileUpdates['/users/' + FTCtrl.currentUser.uid + '/displayName'] = profileData;
    firebase.database().ref().update(profileUpdates)
    .then(function(ref){
      console.log(ref);
      FTCtrl.goBacktoHomepageFromProfile();

    })

  }

  FTCtrl.goBacktoHomepageFromProfile = function() {
    FTCtrl.users.getProfile(FTCtrl.currentUser.uid).$loaded().then(function (profile){
      if(profile.displayName){
        //return profile;
        FTCtrl.currentUserUserList = profile;
        FTCtrl.pageRouter = 'landingPage';
      } else {
        FTCtrl.pageRouter = "profileEdit";

      }
    });
  }

  FTCtrl.setEditInputsToValues = function() {

    FTCtrl.setDisplayNameVar = FTCtrl.currentUserUserList.displayName;

  }


/*
  GGGG  EEEEEEE  OOOOO    TTTTTTT RRRRRR    AAA    CCCCC  KK  KK
 GG  GG EE      OO   OO     TTT   RR   RR  AAAAA  CC    C KK KK
GG      EEEEE   OO   OO     TTT   RRRRRR  AA   AA CC      KKKK
GG   GG EE      OO   OO     TTT   RR  RR  AAAAAAA CC    C KK KK
 GGGGGG EEEEEEE  OOOO0      TTT   RR   RR AA   AA  CCCCC  KK  KK

GEO TRACK
*/
      FTCtrl.lookupLatLng = function() {
          // Try HTML5 geolocation.
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };


              FTCtrl.currentLatLng = pos;
              $scope.$apply();
              console.log(FTCtrl.currentLatLng.lat + " " + FTCtrl.currentLatLng.lng);

            }, function() {
              handleLocationError(true, infoWindow, map.getCenter());
            });
          } else {
            // Browser doesn't support Geolocation
            alert("your browser does not support Geolocation/Try turning it on in your settings")
          }


      }

      FTCtrl.handleLocationError = function(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
      }


/*
NN   NN EEEEEEE WW      WW         GGGG    AAA   MM    MM EEEEEEE
NNN  NN EE      WW      WW        GG  GG  AAAAA  MMM  MMM EE
NN N NN EEEEE   WW   W  WW       GG      AA   AA MM MM MM EEEEE
NN  NNN EE       WW WWW WW       GG   GG AAAAAAA MM    MM EE
NN   NN EEEEEEE   WW   WW         GGGGGG AA   AA MM    MM EEEEEEE

NEW GAME
*/

  FTCtrl.createGameSubmit = function() {

    var gameKey = firebase.database().ref('Games/').push().key;
        var gameUpdates = {};

        FTCtrl.gameOptions = {
          gameLength: FTCtrl.gameDurr,
          gameType: FTCtrl.gameType,
          gameName: FTCtrl.GameName,
          host: FTCtrl.currentUser['uid'],
          originlat: FTCtrl.currentLatLng.lat,
          originlng: FTCtrl.currentLatLng.lng,
          radius: FTCtrl.playRadius,
          gameID: gameKey,
          gameStickers: FTCtrl.sessionStickers


        };
        console.log(FTCtrl.gameOptions);

        gameUpdates['/Games/' + gameKey] = FTCtrl.gameOptions;
        firebase.database().ref().update(gameUpdates)
        .then(function(ref){
          console.log(ref);

          //add user to game
          FTCtrl.JoinGameAddToFirebaseUserInfo(gameKey);

        })

  };



/*
 CCCCC  UU   UU RRRRRR  RRRRRR  EEEEEEE NN   NN TTTTTTT        GGGG    AAA   MM    MM EEEEEEE
CC    C UU   UU RR   RR RR   RR EE      NNN  NN   TTT         GG  GG  AAAAA  MMM  MMM EE
CC      UU   UU RRRRRR  RRRRRR  EEEEE   NN N NN   TTT        GG      AA   AA MM MM MM EEEEE
CC    C UU   UU RR  RR  RR  RR  EE      NN  NNN   TTT        GG   GG AAAAAAA MM    MM EE
 CCCCC   UUUUU  RR   RR RR   RR EEEEEEE NN   NN   TTT         GGGGGG AA   AA MM    MM EEEEEEE

CURRENT GAME
*/

  FTCtrl.getCurrentGame = function($firebaseObject, $firebaseArray) {

    if (FTCtrl.currentUserUserList['gameCurrent'] != null) {
      //console.log(FTCtrl.currentUserUserList);
      FTCtrl.getGameInfoVar.getGameInfo(FTCtrl.currentUserUserList['gameCurrent']).$loaded()
        .then(function (game){

            console.log(game);
            FTCtrl.currentGameGameList = game;

              $scope.foo = FTCtrl.currentGameGameList['$id']
              $scope.$apply();

            //alert("got IT")

        });
        FTCtrl.getGameInfoVar.getGameInfoPlayers(FTCtrl.currentUserUserList['gameCurrent']).$loaded()
          .then(function (gamePlayers){

              //console.log(gamePlayers);
              FTCtrl.currentGamePlayersList = gamePlayers;

              console.log("words can hurt");
              console.log(FTCtrl.currentGamePlayersList);
              $scope.$apply();



          });





    }else{
        $timeout(function () {
          FTCtrl.getCurrentGame();
        }, 100);
    }



  }

  FTCtrl.CurrentGamePlayerRankInterval = function() {
    console.log("updating ranking")
    FTCtrl.CurrentGamePlayerRank = [];
    FTCtrl.CurrentGamePlayerRankDoneList = [];

    var objectArray = FTCtrl.currentGamePlayersList;


    angular.forEach(objectArray, function(whatever, ewkey) {
      var topdog = "";
      var topdogvar = -1;
        angular.forEach(objectArray, function(person, key) {
          console.log(FTCtrl.CurrentGamePlayerRankDoneList.indexOf(person['id']));
          if(person['points'] > topdogvar && FTCtrl.CurrentGamePlayerRankDoneList.indexOf(person['id']) == -1){
            topdogvar = person['points'];
            topdog = {
              name: person['name'],
              id: person['id'],
              points: person['points']
            }
          }
        })

    FTCtrl.CurrentGamePlayerRank.push(topdog)
    FTCtrl.CurrentGamePlayerRankDoneList.push(topdog['id'])
    //console.log(FTCtrl.CurrentGamePlayerRank);
    //console.log(FTCtrl.CurrentGamePlayerRankDoneList);
    })
    console.log(FTCtrl.CurrentGamePlayerRank);
    console.log(FTCtrl.CurrentGamePlayerRankDoneList);


  }

  FTCtrl.cancelCurrentGamePlayerRankInterval = function() {
    $interval.cancel(FTCtrl.CurrentGamePlayerRankPromise);
  }

  FTCtrl.initCurrentGamePlayerRankInterval = function() {
      console.log("current Game")
      FTCtrl.CurrentGamePlayerRankInterval();
      FTCtrl.CurrentGamePlayerRankPromise = $interval(FTCtrl.CurrentGamePlayerRankInterval , 5000);

  }




  FTCtrl.CurrentGameIntervalFunction = function() {
    var CurrentGameID =   document.getElementById('CurrentGameVariableHolder').value;
    //alert("going");
    if(CurrentGameID != 'null'){
      //alert(CurrentGameID);

      FTCtrl.GameLogicHuntersAndGatherers(CurrentGameID);

      document.getElementById('CurrentGameVariableHolder').value = "null";

    }


  }

  FTCtrl.initCurrentGame = function() {
      console.log("current Game")
      FTCtrl.CurrentGameIntervalPromise = $interval(FTCtrl.CurrentGameIntervalFunction , 500);

  }

  FTCtrl.cancelCurrentGame = function () {
    $interval.cancel(FTCtrl.CurrentGameIntervalPromise);
    //console.log("done");
  }



/*
  GGGG    AAA   MM    MM EEEEEEE    LL       OOOOO    GGGG  IIIII  CCCCC
 GG  GG  AAAAA  MMM  MMM EE         LL      OO   OO  GG  GG  III  CC    C
GG      AA   AA MM MM MM EEEEE      LL      OO   OO GG       III  CC
GG   GG AAAAAAA MM    MM EE         LL      OO   OO GG   GG  III  CC    C
 GGGGGG AA   AA MM    MM EEEEEEE    LLLLLLL  OOOO0   GGGGGG IIIII  CCCCC

GAME LOGIC
*/

/*
  FTCtrl.GameLogicHuntersAndGatherers = function(stickerID) {
    FTCtrl.currentLatLng = "";
    //FTCtrl.lookupLatLng()
    FTCtrl.GameLogicHuntersAndGatherersDependancy(stickerID)

  }
*/
  FTCtrl.GameLogicHuntersAndGatherers = function(stickerID) {

    //alert(stickerID)

      angular.forEach(FTCtrl.currentGameGameList['gameStickers'], function(sticker, key) {
        //console.log(sticker);

        if(sticker['stickerName'] == stickerID) {

            angular.forEach(FTCtrl.currentGamePlayersList, function(player, key) {
              if(player['id'] == FTCtrl.currentUser.uid) {
              angular.forEach(player['stickerTag'], function(sticker, key) {
                if(sticker['name'] == stickerID) {
                    var currentTime = Date.now();
                    if(currentTime > sticker['time']) {
                      //alert(sticker['time']);
                      angular.forEach(FTCtrl.currentGamePlayersList, function(player) {
                        if(player['id'] == FTCtrl.currentUser.uid) {
                            console.log(player);
                            FTCtrl.playerPoints = player['points'];
                        }
                      })
                      console.log(FTCtrl.playerPoints);
                      //actually adds points to player
                      FTCtrl.playerPoints = FTCtrl.playerPoints + 1;
                      console.log(FTCtrl.playerPoints);

                      //for cooldown data
                      var currentTime = Date.now();

                      FTCtrl.lastTagStickerUpdatesTime = {
                        name: stickerID,
                        time: currentTime + FTCtrl.StickerCooldownTime
                      }



                      var pointsUpdates = {};
                      var lastTagStickerUpdates = {};
                      pointsUpdates['/GamePlayers/' + FTCtrl.currentGameGameList['$id'] + '/' + FTCtrl.currentUser.uid + '/points'] = FTCtrl.playerPoints;
                      firebase.database().ref().update(pointsUpdates)
                      .then(function(){
                          lastTagStickerUpdates['/GamePlayers/' + FTCtrl.currentGameGameList['$id'] + '/' + FTCtrl.currentUser.uid + '/stickerTag/' + stickerID] = FTCtrl.lastTagStickerUpdatesTime;
                          firebase.database().ref().update(lastTagStickerUpdates)
                          .then(function(){

                            alert("points")

                          })

                      })

                    }else{
                      var timeleft = Math.floor((sticker['time'] - currentTime)/1000);
                      alert("you need to wait " + timeleft + " seconds before you can hit this sticker again");
                    }



                  }
              })
            }
          })

        }


    });

        //alert(stickerID);




  }



/*
    JJJ  OOOOO  IIIII NN   NN       GGGG    AAA   MM    MM EEEEEEE
    JJJ OO   OO  III  NNN  NN      GG  GG  AAAAA  MMM  MMM EE
    JJJ OO   OO  III  NN N NN     GG      AA   AA MM MM MM EEEEE
JJ  JJJ OO   OO  III  NN  NNN     GG   GG AAAAAAA MM    MM EE
 JJJJJ   OOOO0  IIIII NN   NN      GGGGGG AA   AA MM    MM EEEEEEE

JOIN GAME
*/

FTCtrl.JoinGameAddToFirebaseUserInfo = function(gameKey) {
  var addUserToGame = {};
  var playerData = {
    points: 0,
    name: FTCtrl.currentUserUserList['displayName'],
    id: FTCtrl.currentUser.uid,
    pointsHit: {}
  }
  addUserToGame['/GamePlayers/' + gameKey + '/' + FTCtrl.currentUser.uid + '/'] = playerData;
  firebase.database().ref().update(addUserToGame)
  .then(function(ref){
    console.log("added")
    console.log(ref);

    var profileUpdates = {};
    profileUpdates['/users/' + FTCtrl.currentUser.uid + '/gameCurrent'] = gameKey;
    firebase.database().ref().update(profileUpdates)
    .then(function(ref){
      console.log(ref);

      //updates the current game
      FTCtrl.getCurrentGame();
      FTCtrl.pageRouter = 'currentGame';
      $scope.$apply();

    })

  })

}



FTCtrl.JoinGameIntervalFunction = function() {
  var JoinGameID =   document.getElementById('JoinGameVariableHolder').value;
  console.log(JoinGameID)
  if(JoinGameID != 'null'){
    alert(JoinGameID);
    FTCtrl.JoinGameAddToFirebaseUserInfo(JoinGameID);

    console.log("not null");
    FTCtrl.cancelJoinGame()
  }


}

FTCtrl.JoinGame = function() {
    console.log("start check register sticker")
    FTCtrl.JoinGameIntervalPromise = $interval(FTCtrl.JoinGameIntervalFunction , 250);

}

FTCtrl.cancelJoinGame = function () {
  $interval.cancel(FTCtrl.JoinGameIntervalPromise);
  //console.log("done");
}






/*
NN   NN EEEEEEE WW      WW       SSSSS  TTTTTTT IIIII  CCCCC  KK  KK EEEEEEE RRRRRR
NNN  NN EE      WW      WW      SS        TTT    III  CC    C KK KK  EE      RR   RR
NN N NN EEEEE   WW   W  WW       SSSSS    TTT    III  CC      KKKK   EEEEE   RRRRRR
NN  NNN EE       WW WWW WW           SS   TTT    III  CC    C KK KK  EE      RR  RR
NN   NN EEEEEEE   WW   WW        SSSSS    TTT   IIIII  CCCCC  KK  KK EEEEEEE RR   RR

NEW STICKER
*/



      FTCtrl.RegisterSTickerIntervalFunction = function() {

        var stickerVal =   document.getElementById('registerStickerVariableHolder').value;
        FTCtrl.readyForCheckVar = "false";
        FTCtrl.stivkerVal = stickerVal;
        if(stickerVal != 'null'){
          //alert(stickerVal);
          if (FTCtrl.lookupLatLngOnlyOnceVar == "none") {
              FTCtrl.lookupLatLng();
              FTCtrl.lookupLatLngOnlyOnceVar = "once";
              //alert(FTCtrl.lookupLatLngOnlyOnceVar);
          }



          //alert(stickerVal);



          if(FTCtrl.currentLatLng != null){
            //alert(stickerVal);
            FTCtrl.initMapforNewSticker(FTCtrl.currentLatLng.lat, FTCtrl.currentLatLng.lng);

            FTCtrl.cancelRegisterSticker();
            FTCtrl.readyForCheckVar = "true";



          }else{
            FTCtrl.RegisterSTickerIntervalFunction();

          }
        }
      }

      FTCtrl.RegisterSticker = function() {
          console.log("start check register sticker")
          FTCtrl.lookupLatLng();
          FTCtrl.registerStickerIntervalPromise = $interval(FTCtrl.RegisterSTickerIntervalFunction , 250);



      }

      FTCtrl.cancelRegisterSticker = function () {
        $interval.cancel(FTCtrl.registerStickerIntervalPromise);
        //console.log("done");
      }


      FTCtrl.ActullySubmitSticker = function(r) {

        if (r == "true") {
            var updates = {};


            updates['/Stickers/' + FTCtrl.stivkerVal ] = FTCtrl.currentLatLng;

            firebase.database().ref().update(updates)
            .then(function(ref) {
              console.log(ref)
              alert("Sticker Registered");
              FTCtrl.readyForCheckVar = "false";
              FTCtrl.lookupLatLngOnlyOnceVar = "none";
              FTCtrl.stivkerVal = "";
              FTCtrl.setPageRouter('landingPage');
              $scope.$apply();
            });

        } else {
          alert("Sticker Deleted, try again");
          FTCtrl.readyForCheckVar = "false";
          FTCtrl.lookupLatLngOnlyOnceVar = "none";
          FTCtrl.stivkerVal = "";
          FTCtrl.setPageRouter('landingPage');
          $scope.$apply();
        }
      }


/*
MM    MM   AAA   PPPPPP   SSSSS
MMM  MMM  AAAAA  PP   PP SS
MM MM MM AA   AA PPPPPP   SSSSS
MM    MM AAAAAAA PP           SS
MM    MM AA   AA PP       SSSSS

MAPS
*/

      //MAPS API key
      // AIzaSyD842A9boNTY_f19fGtfDaSwnbD562Utfk

      FTCtrl.calcCrow = function(lat1, lon1, lat2, lon2)
            {
              var R = 6371; // km
              var dLat = FTCtrl.toRad(lat2-lat1);
              var dLon = FTCtrl.toRad(lon2-lon1);
              var lat1 = FTCtrl.toRad(lat1);
              var lat2 = FTCtrl.toRad(lat2);

              var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
              var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              var d = R * c;
              return d;
            }


      FTCtrl.toRad = function(Value)
      {
          return Value * Math.PI / 180;
      }


      FTCtrl.initMapforNewSticker = function(latVar, lngVar) {
        var uluru = {lat: latVar, lng: lngVar};
        var map = new google.maps.Map(document.getElementById('newStickerMap'), {
          zoom: 18,
          center: uluru
        });



        var centerIcon = {
            url: 'images/mylocation.png',
            scaledSize: new google.maps.Size(50, 50), // scaled size


        }

       marker = new google.maps.Marker({
          position: uluru,
          map: map,
          icon: centerIcon
        });


      }

      FTCtrl.initMap = function(latVar, lngVar) {
        var uluru = {lat: latVar, lng: lngVar};
        var map = new google.maps.Map(document.getElementById('newGameMap'), {
          zoom: 16,
          center: uluru
        }),

        circle  = new google.maps.Circle({
                    map:map,
                    center:map.getCenter(),
                    radius: FTCtrl.playRadius * 1000,
                    strokeColor: '#4CAF50',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#4CAF50',
                    fillOpacity: 0.35
                  });

        var centerIcon = {
            url: 'images/mylocation.png',
            scaledSize: new google.maps.Size(50, 50), // scaled size


        }

       marker = new google.maps.Marker({
          position: uluru,
          map: map,
          icon: centerIcon
        });

        FTCtrl.sessionStickers = [];

        for (i = 0; i < FTCtrl.AllStickers.length; i++) {
            //console.log(newsessionCtrl.stickers[i]['$id']);
            //console.log(newsessionCtrl.calcCrow(latVar,lngVar,newsessionCtrl.stickers[i]['lat'],newsessionCtrl.stickers[i]['lng']).toFixed(1));
            console.log(FTCtrl.AllStickers[i]['$id']);
            if((FTCtrl.calcCrow(latVar,lngVar,FTCtrl.AllStickers[i]['lat'],FTCtrl.AllStickers[i]['lng']).toFixed(1)) < FTCtrl.playRadius) {

              var data = {
                lat: FTCtrl.AllStickers[i]['lat'],
                lng: FTCtrl.AllStickers[i]['lng']
              }

              var data = {
                stickerName: FTCtrl.AllStickers[i]['$id'],
                stickerLat: FTCtrl.AllStickers[i]['lat'],
                stickerLng: FTCtrl.AllStickers[i]['lng']
              }

              FTCtrl.sessionStickers.push(data);



              var uluru = {lat: FTCtrl.AllStickers[i]['lat'], lng: FTCtrl.AllStickers[i]['lng']};
              marker = new google.maps.Marker({
                       position: uluru,
                       map: map
            })
          }
        };
        console.log(FTCtrl.sessionStickers);

      }



      FTCtrl.setUpMapCalFunction = function() {
          //alert("setting up");
          if (FTCtrl.lookupLatLngOnlyOnceVar == "none") {
              FTCtrl.lookupLatLng();
              FTCtrl.lookupLatLngOnlyOnceVar = "once";
              //alert(FTCtrl.lookupLatLngOnlyOnceVar);
          }

            if(FTCtrl.currentLatLng != null){

              console.log("yep");
              console.log(FTCtrl.currentLatLng.lat);
              console.log(FTCtrl.currentLatLng.lng);
              FTCtrl.lookupLatLngOnlyOnceVar = "none";
              FTCtrl.initMap(FTCtrl.currentLatLng.lat, FTCtrl.currentLatLng.lng)


            }else {
              $timeout(function () {
                FTCtrl.setUpMapCalFunction()
              }, 200);
            }
      }



  })


  .directive('qrcode', ['$window', function($window) {

    var canvas2D = !!$window.CanvasRenderingContext2D,
        levels = {
          'L': 'Low',
          'M': 'Medium',
          'Q': 'Quartile',
          'H': 'High'
        },
        draw = function(context, qr, modules, tile) {
          for (var row = 0; row < modules; row++) {
            for (var col = 0; col < modules; col++) {
              var w = (Math.ceil((col + 1) * tile) - Math.floor(col * tile)),
                  h = (Math.ceil((row + 1) * tile) - Math.floor(row * tile));

              context.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
              context.fillRect(Math.round(col * tile),
                               Math.round(row * tile), w, h);
            }
          }
        };

    return {
      restrict: 'E',
      template: '<canvas class="qrcode"></canvas>',
      link: function(scope, element, attrs) {
        var domElement = element[0],
            $canvas = element.find('canvas'),
            canvas = $canvas[0],
            context = canvas2D ? canvas.getContext('2d') : null,
            download = 'download' in attrs,
            href = attrs.href,
            link = download || href ? document.createElement('a') : '',
            trim = /^\s+|\s+$/g,
            error,
            version,
            errorCorrectionLevel,
            data,
            size,
            modules,
            tile,
            qr,
            $img,
            setVersion = function(value) {
              version = Math.max(1, Math.min(parseInt(value, 10), 40)) || 5;
            },
            setErrorCorrectionLevel = function(value) {
              errorCorrectionLevel = value in levels ? value : 'M';
            },
            setData = function(value) {
              if (!value) {
                return;
              }

              data = value.replace(trim, '');
              qr = qrcode(version, errorCorrectionLevel);
              qr.addData(data);

              try {
                qr.make();
              } catch(e) {
                error = e.message;
                return;
              }

              error = false;
              modules = qr.getModuleCount();
            },
            setSize = function(value) {
              size = parseInt(value, 10) || modules * 2;
              tile = size / modules;
              canvas.width = canvas.height = size;
            },
            render = function() {
              if (!qr) {
                return;
              }

              if (error) {
                if (link) {
                  link.removeAttribute('download');
                  link.title = '';
                  link.href = '#_';
                }
                if (!canvas2D) {
                  domElement.innerHTML = '<img src width="' + size + '"' +
                                         'height="' + size + '"' +
                                         'class="qrcode">';
                }
                scope.$emit('qrcode:error', error);
                return;
              }

              if (download) {
                domElement.download = 'qrcode.png';
                domElement.title = 'Download QR code';
              }

              if (canvas2D) {
                draw(context, qr, modules, tile);

                if (download) {
                  domElement.href = canvas.toDataURL('image/png');
                  return;
                }
              } else {
                domElement.innerHTML = qr.createImgTag(tile, 0);
                $img = element.find('img');
                $img.addClass('qrcode');

                if (download) {
                  domElement.href = $img[0].src;
                  return;
                }
              }

              if (href) {
                domElement.href = href;
              }
            };

        if (link) {
          link.className = 'qrcode-link';
          $canvas.wrap(link);
          domElement = domElement.firstChild;
        }

        setVersion(attrs.version);
        setErrorCorrectionLevel(attrs.errorCorrectionLevel);
        setSize(attrs.size);

        attrs.$observe('version', function(value) {
          if (!value) {
            return;
          }

          setVersion(value);
          setData(data);
          setSize(size);
          render();
        });

        attrs.$observe('errorCorrectionLevel', function(value) {
          if (!value) {
            return;
          }

          setErrorCorrectionLevel(value);
          setData(data);
          setSize(size);
          render();
        });

        attrs.$observe('data', function(value) {
          if (!value) {
            return;
          }

          setData(value);
          setSize(size);
          render();
        });

        attrs.$observe('size', function(value) {
          if (!value) {
            return;
          }

          setSize(value);
          render();
        });

        attrs.$observe('href', function(value) {
          if (!value) {
            return;
          }

          href = value;
          render();
        });
      }
    };
  }])





  .config(function(){
    // Replace this config with your Firebase's config.
    // Config for your Firebase can be found using the "Web Setup"
    // button on the top right of the Firebase Dashboard in the
    // "Authentication" section.

    var config = {
       apiKey: "AIzaSyDTkhkCHqnczzIq13dBgkYSlIrIHBfp7wM",
       authDomain: "fentontag-c0828.firebaseapp.com",
       databaseURL: "https://fentontag-c0828.firebaseio.com",
       storageBucket: "fentontag-c0828.appspot.com",
       messagingSenderId: "646559029376"
     };

    firebase.initializeApp(config);
  });
