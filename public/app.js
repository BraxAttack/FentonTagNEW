
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
    var users = $firebaseArray(gameRef);

    var Game = {
      getGameInfo: function(uid){
        return $firebaseObject(gameRef.child(uid));
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
      FTCtrl.getGameInfo = GameInfo;

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
    var profileData = {
      displayName: FTCtrl.setDisplayNameVar,
      gameCurrent: ''
    };

    profileUpdates['/users/' + FTCtrl.currentUser.uid] = profileData;
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
          var profileUpdates = {};
          profileUpdates['/users/' + FTCtrl.currentUser.uid + '/gameCurrent'] = gameKey;
          firebase.database().ref().update(profileUpdates)
          .then(function(ref){
            //console.log(ref);
                var addUserToGame = {};
                var playerData = {
                  points: 0,
                  pointsHit: {}
                }
                addUserToGame['/GamePlayers/' + gameKey + '/' + FTCtrl.currentUser.uid] = playerData;
                firebase.database().ref().update(addUserToGame)
                .then(function(ref){
                  //console.log(ref);



                  FTCtrl.pageRouter = 'currentGame';
                  $scope.$apply();
                })
          })


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
      FTCtrl.getGameInfo.getGameInfo(FTCtrl.currentUserUserList['gameCurrent']).$loaded()
        .then(function (profile){

            console.log(profile);
            FTCtrl.currentUserUserList = profile;
            //alert("got IT")

        });


    }else{
        $timeout(function () {
          FTCtrl.getCurrentGame();
        }, 100);
    }



  }



/*
RRRRRR  EEEEEEE   GGGG  IIIII  SSSSS  TTTTTTT EEEEEEE RRRRRR
RR   RR EE       GG  GG  III  SS        TTT   EE      RR   RR
RRRRRR  EEEEE   GG       III   SSSSS    TTT   EEEEE   RRRRRR
RR  RR  EE      GG   GG  III       SS   TTT   EE      RR  RR
RR   RR EEEEEEE  GGGGGG IIIII  SSSSS    TTT   EEEEEEE RR   RR

Register
*/






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
          if (FTCtrl.lookupLatLngOnlyOnceVar == "none") {
              FTCtrl.lookupLatLng();
              FTCtrl.lookupLatLngOnlyOnceVar = "once";
              //alert(FTCtrl.lookupLatLngOnlyOnceVar);
          }



          //alert(stickerVal);
          FTCtrl.cancelRegisterSticker();


          if(FTCtrl.currentLatLng != null){

            FTCtrl.initMapforNewSticker(FTCtrl.currentLatLng.lat, FTCtrl.currentLatLng.lng);

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
              FTCtrl.sessionStickers.push(FTCtrl.AllStickers[i]['$id']);
              var uluru = {lat: FTCtrl.AllStickers[i]['lat'], lng: FTCtrl.AllStickers[i]['lng']};
              marker = new google.maps.Marker({
                       position: uluru,
                       map: map
            })
          }
        };


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
