//'use strict';

window.Nawrs = angular.module('nawrs', ['ui-leaflet', 'elasticsearch', 'ngTable']);

// the application
Nawrs.controller('geoSearch', ['$scope', '$http', '$filter', 'client', 'esFactory', '$location', 'NgTableParams', 'leafletMapEvents', 'leafletData', function ($scope, $http, $filter, client, esFactory, $location, NgTableParams, leafletMapEvents, leafletData) {
  // Map bindings

  $scope.state_ref_layer = L.featureGroup();
  $scope.state_facets = L.featureGroup();
  $scope.state_select = [];

  $scope.watershed_ref_layer = L.featureGroup();
  $scope.watershed_facets = L.featureGroup();
  $scope.watershed_select = [];

  $scope.tribal_boundary_layer = L.featureGroup();
  $scope.tribal_boundary_facets = L.featureGroup();
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

  $http.get('nawrs/data/us_state_PR_1hundthDD.geojson').success(function(data, status){
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer){
          $scope.state_select.push(layer.feature);
        }
      });
      var i = 0;
      for (; i < $scope.state_select.length; i++){
        $scope.state_select[i].selected = false;
      }
      $scope.state_ref_layer.addLayer(newLayer);
    })
  })

  $http.get('nawrs/data/wbdhu2_PR_1hundthDD.geojson').success(function(data, status){
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer){
          $scope.watershed_select.push(layer.feature);
        }
      });
      var i = 0;
      for (; i < $scope.watershed_select.length; i++){
        $scope.watershed_select[i].selected = false;
      }
      $scope.watershed_ref_layer.addLayer(newLayer);
    })
  })

  $http.get('nawrs/data/tl_2011_PR_1hundthDD.geojson').success(function(data, status){
    leafletData.getMap().then(function(map){
      var newLayer = L.geoJSON(data, {
        onEachFeature: function(feature, layer){
          $scope.tribal_boundary_select.push(layer.feature);
        }
      });
      var i = 0;
      for (; i < $scope.tribal_boundary_select.length; i++){
        $scope.tribal_boundary_select[i].selected = false;
      }
      $scope.tribal_boundary_layer.addLayer(newLayer);
    })
  })

  $scope.changeTiles = function(tiles) {
    $scope.tiles = tilesDict[tiles];
  }

  $scope.clearFacets = function(){
    $scope.facets = [];
    $scope.geo_facets = [];
    var vi = 0;
    for (; vi < $scope.state_select.length; vi++){
      $scope.state_select[vi].selected = false;
    }
    var vii = 0;
    for (; vii < $scope.watershed_select.length; vii++){
      $scope.watershed_select[vii].selected = false;
    }
    var viii = 0;
    for (; viii < $scope.tribal_boundary_select.length; viii++){
      $scope.tribal_boundary_select[viii].selected = false;
    }
    leafletData.getMap().then(function(map){
      $scope.watershed_facets.clearLayers();
      $scope.state_facets.clearLayers();
      $scope.tribal_boundary_facets.clearLayers();
    })
    $scope.search();
  }

  // Handle search and facet bindings
  var self = this;
  self.tableParams = new NgTableParams({}, { dataset: $scope.docs});

  $scope.searchTerm = $location.search().q;
  $scope.docs = [];
  $scope.doc_type = [];
  $scope.doc_geometry = [];
  $scope.cur_doc_geometry = [];
  $scope.subject = [];
  $scope.facets = [];
  $scope.geo_facets = [];
  $scope.feature_set = L.featureGroup();

  $scope.search = function(search_type){
    $scope.docs = [];
    $scope.facets = [];
    $scope.geo_facets = [];
    $scope.doc_geometry = [];
    $scope.cur_doc_geometry = [];
    $scope.doc_type = [];
    $scope.subject = [];

    leafletData.getMap().then(function(map){
      $scope.feature_set.clearLayers();
      $scope.watershed_facets.clearLayers();
      $scope.state_facets.clearLayers();
      $scope.tribal_boundary_facets.clearLayers();
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
      var vi = 0;
      for (; vi < $scope.state_select.length; vi++){
        $scope.state_select[vi].selected = false;
      }
      var vii = 0;
      for (; vii < $scope.watershed_select.length; vii++){
        $scope.watershed_select[vii].selected = false;
      }
      var viii = 0;
      for (; viii < $scope.tribal_boundary_select.length; viii++){
        $scope.tribal_boundary_select[viii].selected = false;
      }
      leafletData.getMap().then(function(map){
        var v = 0;
        for (; v < $scope.doc_geometry.length; v++) {
          $scope.doc_geometry[v].selected = true;
          var newLayer =  L.geoJSON($scope.doc_geometry[v], {
            style: function(feature){
              return {color: "red"};
            }
          }).bindPopup (function(layer){
            return layer.feature.properties.NAMELSAD;
          });
          $scope.feature_set.addLayer(newLayer);
        }
        $scope.feature_set.addTo(map);
        map.fitBounds($scope.feature_set.getBounds());
      })
    })
  }

  $scope.set_facets = function(){
    // get all checked and redo search - don't store old
    var xx = 0;
    for (;xx < $scope.doc_geometry.length; xx++){
      $scope.cur_doc_geometry.push($scope.doc_geometry[xx]);
    }
    $scope.facets = [];
    $scope.geo_facets = [];
    $scope.doc_geometry = [];
    leafletData.getMap().then(function(map){
      $scope.feature_set.clearLayers();
      $scope.watershed_facets.clearLayers();
      $scope.state_facets.clearLayers();
      $scope.tribal_boundary_facets.clearLayers();
    })
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
    angular.forEach($scope.cur_doc_geometry, function(facet){
      if (facet.selected){
        if (facet.geometry.coordinates[0].length == 1){
          $scope.geo_facets.push(facet.geometry.coordinates[0][0])
        } else {
          $scope.geo_facets.push(facet.geometry.coordinates[0]);
        }
      }
    })
    angular.forEach($scope.state_select, function(facet){
      if (facet.selected){
        if (facet.geometry.coordinates[0].length == 1){
          $scope.geo_facets.push(facet.geometry.coordinates[0][0])
        } else {
          $scope.geo_facets.push(facet.geometry.coordinates[0]);
        }
        leafletData.getMap().then(function(map){
          var newLayer = L.geoJSON(facet);
          $scope.state_facets.addLayer(newLayer);
          $scope.state_facets.addTo(map);
        })
      }
    })
    angular.forEach($scope.watershed_select, function(facet){
      if (facet.selected){
        if (facet.geometry.coordinates[0].length == 1){
          $scope.geo_facets.push(facet.geometry.coordinates[0][0])
        } else {
          $scope.geo_facets.push(facet.geometry.coordinates[0]);
        }
        leafletData.getMap().then(function(map){
          var newLayer = L.geoJSON(facet);
          $scope.watershed_facets.addLayer(newLayer);
          $scope.watershed_facets.addTo(map);
        })
      }
    })
    angular.forEach($scope.tribal_boundary_select, function(facet){
      if (facet.selected){
        /*if (facet.geometry.coordinates[0].length == 1){
          $scope.geo_facets.push(facet.geometry.coordinates[0][0])
        } else {
          $scope.geo_facets.push(facet.geometry.coordinates[0]);
        }*/
        $scope.geo_facets.push(facet.geometry.coordinates[0]);
        leafletData.getMap().then(function(map){
          var newLayer = L.geoJSON(facet);
          $scope.tribal_boundary_facets.addLayer(newLayer);
          $scope.tribal_boundary_facets.addTo(map);
        })
      }
    })
    $scope.facet_search();
  };

  $scope.facet_search = function(){
    $scope.docs = [];
    client.search($scope.searchTerm, $scope.facets, $scope.geo_facets).then(function(results){
      var i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
        $scope.doc_geometry.push(results[1][i].polygon.features[0]);
      }
      leafletData.getMap().then(function(map){
        var vi = 0;
        for (; vi < $scope.doc_geometry.length; vi++) {
          var newLayer =  L.geoJSON($scope.doc_geometry[vi], {
            style: function(feature){
              return {color: "red"};
            }
          }).bindPopup (function(layer){
            return layer.feature.properties.NAMELSAD;
          });
          $scope.feature_set.addLayer(newLayer);
        }
        $scope.feature_set.addTo(map);
        map.fitBounds($scope.feature_set.getBounds());
      })
    })
  }

}]);

Nawrs.factory('client', ['esFactory', '$location', '$q', function (esFactory, $location, $q) {
  var client = esFactory({
    host: 'compute.karlbenedict.com/es',
    apiVersion: '5.0'
  });

  client.ping({
    requestTimeout: 30000,
  }, function (error) {
    if (error) {
      console.error('Failed to connect to Elasticsearch.');
    } else {
      console.log('Connected to Elasticsearch.');
    }
  });

  var search = function(term, filter_terms, filter_geo){
    var deferred = $q.defer();
    var query = {};
    if (filter_geo.length != 0 && filter_terms.length == 0){
      var outer = [];
      var c = 0;
      for (;c < filter_geo.length; c++){
        var inner = [];
        inner.push(filter_geo[c]);
        outer.push(inner);
      }
      query = {
        "bool" : {
          "must" : {
            "match_all" : {}
          },
          "filter" : {
            "geo_shape": {
              "centroid.features.geometry": {
                "shape": {
                  "type": "multipolygon",
                  "coordinates" : outer
                },
                "relation": "intersects"
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
    var outer = [];
    var c = 0;
    for (;c < filter_geo.length; c++){
      var inner = [];
      inner.push(filter_geo[c]);
      outer.push(inner);
    }
    query = {
      bool: {
        must: [{
          match: {
            _all: term
          },
          "filter" : {
            "geo_shape": {
              "centroid.features.geometry": {
                "shape": {
                  "type": "multipolygon",
                  "coordinates" : outer
                },
                "relation": "intersects"
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
