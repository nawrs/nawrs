//'use strict';

window.Nawrsapp = angular.module('nawrsapp', ['ui-leaflet', 'elasticsearch']);

// the application
Nawrsapp.controller('mapCtrl', ['mapService', '$scope', '$location', function(docs, $scope, $location){
  var initChoices = ['navajo', 'paiute'];

  var idx = Math.floor(Math.random() * initChoices.length);

  angular.extend($scope, {
    elasticcentroid: {},
    elasticjson: {}
  })

  $scope.elasticcentroid = {
    // placeholder property
    lat: 39.5,
    lng: -98.35,
    zoom: 4
  }

  $scope.docs = [];
  $scope.page = 0;
  $scope.allResults = false;

  $scope.searchTerm = $location.search().q || initChoices[idx];

  $scope.search = function(){
    $scope.page = 0;
    $scope.docs = [];
    $scope.allResults = false;
    $location.search({'q': $scope.searchTerm});
    $scope.loadmore();
  };

  $scope.loadmore = function(){
    docs.search($scope.searchTerm, $scope.page++).then(function(results){
      if(results.length !== 10){
        $scope.allResults = true;
      }

      var ii = 0;

      for (; ii < results.length; ii++){
        $scope.docs.push(results[ii]);
      }
      $scope.elasticcentroid = {
        lat: $scope.docs[0].centroid.features[0].geometry.coordinates[1],
        lng: $scope.docs[0].centroid.features[0].geometry.coordinates[0],
        zoom: 8
      }
      $scope.elasticjson = {
        data: $scope.docs[0].polygon
      }
    });
  };

  $scope.loadmore();
}])

Nawrsapp.factory('mapService', ['$q', 'esFactory', '$location', function($q, elasticsearch, $location){
  var client = elasticsearch({
    host: $location.host() + ':9200'
  });

  var search = function(term, offset) {
    var deferred = $q.defer();
    var query = {
      match: {
        _all: term
      }
    };

    client.search({
      index: "nawrs",
      type: "item",
      body: {
        size: 10,
        from: (offset || 0) * 10,
        query: query
      }
    }).then(function(result){
      console.log(result);
      var ii = 0, hits_in, hits_out = [];
      hits_in = (result.hits || {}).hits || [];
      for(; ii < hits_in.length; ii++){
        hits_out.push(hits_in[ii]._source);
      }
      deferred.resolve(hits_out);
    }, deferred.reject);

    return deferred.promise;
  };

  return {
    search: search
  };

}]);
