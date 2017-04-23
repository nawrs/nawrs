//'use strict';

window.Nawrs = angular.module('nawrs', ['ui-leaflet', 'elasticsearch', 'ngTable']);

// the application
Nawrs.controller('geoSearch', ['$scope', '$http', '$filter', 'client', 'esFactory', '$location', 'NgTableParams', 'leafletMapEvents', 'leafletData', function ($scope, $http, $filter, client, esFactory, $location, NgTableParams, leafletMapEvents, leafletData) {
  // Map bindings

  $scope.state_ref_layer = L.featureGroup();
  $scope.state_select = [];

  $scope.watershed_ref_layer = L.featureGroup();
  $scope.watershed_select = [];

  $scope.tribal_boundary_layer = L.featureGroup();
  $scope.tribal_boundary_select = [];

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
      //overlays: {}
    }
  })

  $http.get('data/us_state_PR_1hundthDD.geojson').success(function(data, status){
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer){
          $scope.state_select.push(layer.feature);
        }
      });
      $scope.state_ref_layer.addLayer(newLayer);
    })
  })

  $http.get('/data/wbdhu2_PR_1hundthDD.geojson').success(function(data, status){
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer){
          $scope.watershed_select.push(layer.feature);
        }
      });
      $scope.watershed_ref_layer.addLayer(newLayer);
    })
  })

  $http.get('/data/tl_2011_PR_1hundthDD.geojson').success(function(data, status){
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer){
          $scope.tribal_boundary_select.push(layer.feature);
        }
      });
      $scope.tribal_boundary_layer.addLayer(newLayer);
    })
  })

  $scope.changeTiles = function(tiles) {
    $scope.tiles = tilesDict[tiles];
  }

  $scope.ref_layer_select = function(selected){
    $scope.facets = [];
    $scope.geo_facets = [];
    if (selected.geometry.coordinates[0].length == 1){
      $scope.geo_facets.push(selected.geometry.coordinates[0][0])
    } else {
      $scope.geo_facets.push(selected.geometry.coordinates[0]);
    }
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(selected).addTo(map);
    })
    $scope.facet_search();
  }

  // Handle search and facet bindings
  var self = this;
  self.tableParams = new NgTableParams({}, { dataset: $scope.docs});

  $scope.searchTerm = $location.search().q;
  $scope.docs = [];
  $scope.doc_type = [];
  $scope.doc_geometry = [];
  $scope.subject = [];
  $scope.facets = [];
  $scope.geo_facets = [];
  $scope.feature_set = L.featureGroup();

  $scope.search = function(search_type){
    $scope.docs = [];
    $scope.facets = [];
    $scope.geo_facets = [];
    $scope.doc_geometry = [];
    $scope.doc_type = [];
    $scope.subject = [];

    leafletData.getMap().then(function(map){
      $scope.feature_set.clearLayers();
    })

    client.search($scope.searchTerm, $scope.facets, $scope.geo_facets).then(function(results){
      var i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
        $scope.doc_geometry.push(results[1][i].polygon.features[0]);
      }
      var ii = 0;
      $scope.doc_type = results[0].doc_type.buckets;
      for (; ii < $scope.doc_type.length; ii++){
        $scope.doc_type[ii].selected = false;
      }
      $scope.subject = results[0].subject.buckets;
      var iii = 0;
      for (; iii < $scope.subject.length; iii++){
        $scope.subject[iii].selected = false;
      }
      var iv = 0;
      for (; iv < $scope.doc_geometry.length; iv++){
        $scope.doc_geometry[iv].selected = false;
      }
      leafletData.getMap().then(function(map){
        var v = 0;
        for (; v < $scope.doc_geometry.length; v++) {
          var newLayer =  L.geoJSON($scope.doc_geometry[v], {
            style: function(feature){
              return {color: "red"};
            },
            onEachFeature: function(feature, layer){
              layer.on({
                click: function(){
                  layer.feature.selected = true;
                  $scope.set_facets();
                }
              })
            }
          })/*.bindPopup (function(layer){
            return layer.feature.properties.NAMELSAD;
          })*/;
          $scope.feature_set.addLayer(newLayer);
        }
        $scope.feature_set.addTo(map);
        map.fitBounds($scope.feature_set.getBounds());
      })
    })
  }

  $scope.set_facets = function(){
    // get all checked and build search - don't store old
    $scope.facets = [];
    $scope.geo_facets = [];
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
    angular.forEach($scope.doc_geometry, function(facet){
      if (facet.selected){
        //console.log(facet.properties.NAMELSAD);
        if (facet.geometry.coordinates[0].length == 1){
          $scope.geo_facets.push(facet.geometry.coordinates[0][0])
        } else {
          $scope.geo_facets.push(facet.geometry.coordinates[0]);
        }
      }
    })
    $scope.facet_search();
  };

  $scope.facet_search = function(){
    $scope.docs = [];
    leafletData.getMap().then(function(map){
      $scope.feature_set.clearLayers();
    })
    var v = 0;
    for (; v < $scope.doc_geometry.length; v++){
      $scope.doc_geometry[v].selected = false;
    }
    $scope.doc_geometry = [];
    client.search($scope.searchTerm, $scope.facets, $scope.geo_facets).then(function(results){
      i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
        $scope.doc_geometry.push(results[1][i].polygon.features[0]);
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
      leafletData.getMap().then(function(map){
        var vi = 0;
        for (; vi < $scope.doc_geometry.length; vi++) {
          var newLayer =  L.geoJSON($scope.doc_geometry[vi], {
            style: function(feature){
              return {color: "red"};
            },
            onEachFeature: function(feature, layer){
              layer.on({
                click: function(){
                  layer.feature.selected = true;
                  $scope.set_facets();
                }
              })
            }
          })/*.bindPopup (function(layer){
            return layer.feature.properties.NAMELSAD;
          })*/;
          $scope.feature_set.addLayer(newLayer);
        }
        $scope.feature_set.addTo(map);
        map.fitBounds($scope.feature_set.getBounds());
      })
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
      //console.log('All is well');
    }
  });

  var search = function(term, filter_terms, filter_geo){
    var deferred = $q.defer();
    var query = {};
    if (filter_geo.length != 0 && filter_terms.length == 0){
      query = {
        "bool" : {
          "must" : {
            "match_all" : {}
          },
          "filter" : {
            "geo_polygon" : {
              "coverage" : {
                "points" : filter_geo[0]
              }
            }
          }
        }
      }
    } else if (filter_geo.length == 0 && filter_terms.length != 0){
      query = {
        bool: {
          must: [{
            match: {
              _all: term
            }
          }
        ],
        filter: filter_terms
      }
    }
  } else if (filter_geo.length != 0 && filter_terms.length != 0){
    query = {
      bool: {
        must: [{
          match: {
            _all: term
          },
          "filter" : {
            "geo_polygon" : {
              "coverage" : {
                "points" : filter_geo[0]
              }
            }
          }
        }
      ],
      filter: filter_terms
    }
  }
} else if (filter_geo.length == 0 && filter_terms.length == 0){
  query = {
    bool: {
      must: [{
        match: {
          _all: term
        }
      }
    ]
  }
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
  //console.log(result);
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
