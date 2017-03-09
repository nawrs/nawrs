//'use strict';

window.Nawrsapp = angular.module('nawrsapp', ['ui-leaflet', 'elasticsearch']);

// the application

Nawrsapp.controller('mapCtrl', ['mapService', '$scope', '$http', '$location', 'leafletMapEvents', function(mapService, $scope, $http, $location, leafletMapEvents){
  var initChoices = ['navajo', 'paiute', 'settlement'];

  var idx = Math.floor(Math.random() * initChoices.length);

  angular.extend($scope, {
    elasticcentroid: {},
    elasticjson: {},
    events: {
      map: {
        enable: ['click'],
        logic: 'emit'
      }
    },
    layers: {
      baselayers: {
        osm: {
          name: "OpenStreetMap",
          url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          type: 'xyz'
        },
        usgs_topo: {
          name: 'USGS Topographical',
          type: 'wms',
          url: 'https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WmsServer?',
          layerParams: {
            layers: '0',
            format: 'image/png',
            transparent: true
          }
        }
      },
      overlays: {}
    }
  })

  $http.get('data/us_state_PR_1hundthDD.geojson').success(function(data, status){
    angular.extend($scope.layers.overlays, {
      states: {
        name: 'States',
        type: 'geoJSONShape',
        data: data,
        layerOptions: {
          style: {
            color: 'blue',
            fillColor: 'blue',
            weight: 1.5,
            opacity: 0.3,
            fillOpacity: 0.1
          },
          onEachFeature: onSelect
        }
      }
    })
  })

  $http.get('/data/wbdhu2_PR_1hundthDD.geojson').success(function(data, status){
    angular.extend($scope.layers.overlays, {
      watersheds: {
        name: 'Watersheds',
        type: 'geoJSONShape',
        data: data,
        layerOptions: {
          style: {
            color: 'blue',
            fillColor: 'blue',
            weight: 1.5,
            opacity: 0.3,
            fillOpacity: 0.1
          },
          onEachFeature: onSelect
        }
      }
    })
  })

  function onSelect(feature, layer) {
    layer.on({
      click: function() {
        //console.log(layer.feature.properties.NAME);
        $scope.$apply(function () {
          $scope.selectedFeature = layer.feature.properties.NAME;
          $scope.selectedPolygon = layer.feature.geometry.coordinates[0][0];
          //$scope.searchTerm = layer.feature.properties.NAME;
          //$scope.search();
        })
      }
    })
  }

  //$scope.spatialTerm = {};

  $scope.$on('leafletDirectiveMap.click', function(event, args){
    $scope.searchTerm = $scope.selectedPolygon;
    //console.log($scope.spatialTerm);
    $scope.search();
  });

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
    //$location.search({'q': $scope.searchTerm});
    $scope.loadmore();
  };

  $scope.loadmore = function(){
    mapService.search($scope.searchTerm, $scope.page++).then(function(results){
      if(results.length !== 10){
        $scope.allResults = true;
      }

      var ii = 0;

      for (; ii < results.length; ii++){
        $scope.docs.push(results[ii]);
      }
      $scope.elasticjson = {
        data: $scope.docs[0].polygon
      }
      for (; ii < $scope.docs.length; ii++){
        //
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
    var query = {};

    if(term.constructor === Array) {
      query = {
        "bool" : {
            "must" : {
                "match_all" : {}
            },
            "filter" : {
                "geo_polygon" : {
                    "coverage" : {
                        "points" : term
                    }
                }
            }
        }
      }
    } else {
      query = {
        match: {
          _all: term
        }
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
