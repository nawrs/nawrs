//'use strict';

window.Nawrs = angular.module('nawrs', ['ui-leaflet', 'elasticsearch', 'ngTable']);

// the application
Nawrs.controller('geoSearch', ['$scope', '$http', 'client', 'esFactory', '$location', 'NgTableParams', 'leafletMapEvents', 'leafletData', function ($scope, $http, client, esFactory, $location, NgTableParams, leafletMapEvents, leafletData) {
  // Map bindings

  var tilesDict = {
    osm: {
      name: "OpenStreetMap",
      url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      type: 'xyz',
      options: {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    stamen_ter: {
      name: "Stamen Terrain",
      url: 'http://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}',
      options: {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        ext: 'png'
      }
    },
    esri_world: {
      name: "ESRI World Imagery",
      url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    }
  }

  angular.extend($scope, {
    tiles: tilesDict.osm,
    centroid: {
      lat: 39.5,
      lng: -98.35,
      zoom: 4
    },
    events: {
      map: {
        enable: ['click'],
        logic: 'emit'
      }
    },
    layers: {
      overlays: {}
    },
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
        visible: false,
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
        $scope.$apply(function () {
          $scope.selectedFeature = layer.feature.properties.NAME;
          $scope.selectedPolygon = layer.feature.geometry.coordinates[0][0];
        })
      }
    })
  }

  $scope.changeTiles = function(tiles) {
    $scope.tiles = tilesDict[tiles];
  }

  $scope.$on('leafletDirectiveMap.click', function(event, args){
    // Use a separate term for a geospatial search,
    // do sorting in search() and facet_search() methods
    //$scope.searchTerm = $scope.selectedPolygon;
    $scope.search();
  });

  // Handle search and facet bindings
  var self = this;
  self.tableParams = new NgTableParams({}, { dataset: $scope.docs});

  $scope.searchTerm = $location.search().q || 'water rights';
  $scope.docs = [];
  $scope.doc_type = [];
  $scope.subject = [];
  $scope.facets = [];

  $scope.search = function(){
    $scope.docs = [];
    $scope.facets = [];
    client.search($scope.searchTerm, $scope.filters).then(function(results){
      i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
      }
      ii = 0;
      $scope.doc_type = results[0].doc_type.buckets;
      for (; ii < $scope.doc_type.length; ii++){
        $scope.doc_type[ii].selected = false;
      }
      $scope.subject = results[0].subject.buckets;
      iii = 0;
      for (; iii < $scope.subject.length; iii++){
        $scope.subject[iii].selected = false;
      }
    })
  }

  $scope.set_facets = function(){
    // get all checked and build search - don't store old
    $scope.facets = [];
    angular.forEach($scope.doc_type, function(facet){
      if (facet.selected){
        var f = {
          "term": {}
        };
        f.term.type = facet.key;
        $scope.facets.push(f);
      }
    })
    angular.forEach($scope.subject, function(facet){
      if (facet.selected){
        var f = {
          "term": {}
        };
        f.term.subject = facet.key;
        $scope.facets.push(f);
      }
    })
    $scope.facet_search();
  };

  $scope.facet_search = function(){
    $scope.docs = [];
    client.search($scope.searchTerm, $scope.facets).then(function(results){
      i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
      }
      // Update document count in facets
      ii = 0;
      for (; ii < $scope.doc_type.length; ii++){
        // Reset doc count to zero - this seems like a hack but it works
        $scope.doc_type[ii].doc_count = 0;
        iii = 0;
        for (; iii < results[0].doc_type.buckets.length; iii++){
          if ($scope.doc_type[ii].key == results[0].doc_type.buckets[iii].key){
            $scope.doc_type[ii].doc_count = results[0].doc_type.buckets[iii].doc_count;
          }
        }
      }
      iv = 0;
      for (; iv < $scope.subject.length; iv++){
        // Reset doc count to zero - this seems like a hack but it works
        $scope.subject[iv].doc_count = 0;
        v = 0;
        for (; v < results[0].subject.buckets.length; v++){
          if ($scope.subject[iv].key == results[0].subject.buckets[v].key){
            $scope.subject[iv].doc_count = results[0].subject.buckets[v].doc_count;
          }
        }
      }
    })
  }

  $scope.search();

}]);

Nawrs.factory('client', ['esFactory', '$location', '$q', function (esFactory, $location, $q) {
  var client = esFactory({
    host: $location.host() + ':9205',
    apiVersion: '5.0'
  });

  client.ping({
    requestTimeout: 30000,
  }, function (error) {
    if (error) {
      console.error('elasticsearch cluster is down!');
    } else {
      console.log('All is well');
    }
  });

  var search = function(term, filter_terms){
    var deferred = $q.defer();
    var query = {
      bool: {
        must: [{
          match: {
            _all: term
          }
        }
      ],
      filter: filter_terms
    }
  };
  client.search({
    index: 'nawrs',
    type: 'item',
    size: 1000,
    body: {
      query: query,
      aggregations: {
        doc_type: {
          terms: {
            field: "type"
          }
        },
        subject: {
          terms: {
            field: "subject"
          }
        }
      }
    }
  }).then(function(result){
    console.log(result);
    var docs_aggs = [];
    docs_aggs.push(result.aggregations);
    var ii = 0, hits_in, hits_out = [];
    hits_in = (result.hits || {}).hits || [];
    for(; ii < hits_in.length; ii++){
      hits_out.push(hits_in[ii]._source);
    }
    docs_aggs.push(hits_out);
    deferred.resolve(docs_aggs);
  }, deferred.reject);

  return deferred.promise;

};

return {
  search: search
};
}]);
