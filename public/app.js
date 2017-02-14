
  var app = angular.module("fentonTagApp", [
    'firebase'
  ]);



  app.controller("FentonTagCtrl", function($scope) {

      var FTCtrl = this;

      FTCtrl.signedIn = "";
      FTCtrl.authEmail = "";
      FTCtrl.authPass = "";

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
