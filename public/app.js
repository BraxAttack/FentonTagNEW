
  var app = angular.module("fentonTagApp", [
    'firebase'
  ]);



  app.factory('Stickers', function($firebaseArray){

    var ref = firebase.database().ref('/Stickers');
    var stickers = $firebaseArray(ref);

    return stickers;
  })


  .controller("FentonTagCtrl", function($scope, $interval, $timeout, Stickers) {

      var FTCtrl = this;

      FTCtrl.signedIn = "";
      FTCtrl.authEmail = "";
      FTCtrl.authPass = "";
      FTCtrl.AllStickers = Stickers;


      //default routes to homepage on controller load
      FTCtrl.pageRouter = "landingPage";

      FTCtrl.setPageRouter = function(location) {
          FTCtrl.pageRouter = location;

      };


      FTCtrl.authSignInWEmailPass = function() {
        var auth = firebase.auth();
        var email = FTCtrl.authEmail;
        var password = FTCtrl.authPass;
        var promise = auth.signInWithEmailAndPassword(email, password);
        promise.catch(function(e) {
          alert(e.message);
        });

      }


      FTCtrl.logOut = function() {
        firebase.auth().signOut();
        FTCtrl.signedIn = 'false';
        $scope.$apply();
      };



      firebase.auth().onAuthStateChanged(firebaseUser => {
        if(firebaseUser) {
          console.log('got em');
          FTCtrl.signedIn = 'true';
          $scope.$apply();
        } else {
          console.log('not logged in');
          FTCtrl.signedIn = 'false';
          $scope.$apply();
        }
      })



      FTCtrl.products = ["Milk", "Bread", "Cheese"];


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

      //FTCtrl.lookupLatLng();

      FTCtrl.lookupLatLngOnlyOnceVar = "none";

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



      //MAPS API key
      // AIzaSyD842A9boNTY_f19fGtfDaSwnbD562Utfk

      FTCtrl.playRadius = .4;

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
        var map = new google.maps.Map(document.getElementById('map'), {
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
