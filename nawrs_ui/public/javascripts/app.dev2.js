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
      overlays: {}
    },
    legend: {
      position: "bottomleft",
      colors: ["#ff0000", "#8bbd70", "#8986d3", "#efd37f"],
      labels: ["Tribal Lands with Associated Documents", "State Boundaries", "Watershed Boundaries", "Tribal Boundaries"]
    }
  })



  // TODO: geojson files below will not be used for faceting, re-purpose as reference layers
  // Begin GeoJSON bindings for beta facets, including show/hide buttons

  $http.get('data/us_state_PR_1hundthDD.geojson').success(function(data, status){
    angular.extend($scope.layers.overlays, {
      states: {
        name: "States",
        type: "geoJSONShape",
        data: data,
        layerOptions: {
          style: {
            color: 'green',
            fillColor: 'green',
            weight: 1.5,
            opacity: 0.2,
            fillOpacity: 0.05
          },
          onEachFeature: function (feature, layer){
            layer.bindPopup(feature.properties.NAME);
          }
        }
      }
    })
  })

  $http.get('data/wbdhu2_PR_1hundthDD.geojson').success(function(data, status){
    angular.extend($scope.layers.overlays, {
      watersheds: {
        name: "Watersheds",
        type: "geoJSONShape",
        data: data,
        layerOptions: {
          style: {
            color: 'blue',
            fillColor: 'blue',
            weight: 1.5,
            opacity: 0.2,
            fillOpacity: 0.05
          },
          onEachFeature: function (feature, layer){
            layer.bindPopup(feature.properties.NAME);
          }
        }
      }
    })
  })

  $http.get('data/tl_2011_PR_1hundthDD.geojson').success(function(data, status){
    angular.extend($scope.layers.overlays, {
      tblands: {
        name: "Tribal Lands",
        type: "geoJSONShape",
        data: data,
        layerOptions: {
          style: {
            color: 'orange',
            fillColor: 'orange',
            weight: 1.5,
            opacity: 0.2,
            fillOpacity: 0.05
          },
          onEachFeature: function (feature, layer){
            layer.bindPopup(feature.properties.NAME);
          }
        }
      }
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

  $scope.clearWtshd = function(){
    $scope.geo_facets.watershed = [];
    $scope.set_facets();
  }

  $scope.clearState = function(){
    $scope.geo_facets.state = [];
    $scope.set_facets();
  }

  $scope.clearTblbd = function(){
    $scope.geo_facets.tblbd = [];
    $scope.set_facets();
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
  $scope.geo_facets = {};
  $scope.geo_facets.watershed = [];
  $scope.geo_facets.state = [];
  $scope.geo_facets.tblbd = [];
  $scope.feature_set = L.featureGroup();
  $scope.searchTerm = '';
  $scope.noResult = 'Sorry -- your search returned no results. Please enter a new search term or reset filters.';
  $scope.show_no_result = false;
  $scope.waiting = false;


  // refactoring facets
  // bind geometries returned by search to checkbox (single selection)
  $scope.state_check = [];
  $scope.wtshd_check = [];
  $scope.tblbd_check = [];

  $scope.set_wtshd = function(){
    //console.log($scope.geo_facets.watershed);
    $scope.geo_facets.watershed.refIndexType = "watershedsdev";
    $scope.set_facets();
  }

  $scope.set_state = function(){
    $scope.geo_facets.state.refIndexType = "usstatesdev";
    $scope.set_facets();
  }

  $scope.set_tblbd = function(){
    $scope.geo_facets.tblbd.refIndexType = "triballandsdev";
    $scope.set_facets();
  }

  $scope.resetSearch = function(){
    $scope.searchTerm = '';
    $scope.search();
  }


  $scope.search = function(){
    $scope.docs = [];
    $scope.geo_facets = {};
    $scope.geo_facets.watershed = [];
    $scope.geo_facets.state = [];
    $scope.geo_facets.tblbd = [];
    $scope.doc_geometry = [];
    $scope.cur_doc_geometry = [];
    $scope.subject = [];
    $scope.wtshd_check = [];
    $scope.state_check = [];
    $scope.tblbd_check = [];

    leafletData.getMap().then(function(map){
      $scope.feature_set.clearLayers();
      $scope.watershed_facets.clearLayers();
      $scope.state_facets.clearLayers();
      $scope.tribal_boundary_facets.clearLayers();
    })
    $scope.waiting = true;
    $scope.show_no_result = false;

    client.search($scope.searchTerm, $scope.geo_facets).then(function(results){
      //console.log(results);
      $scope.waiting = false;
      if (results.documents.hits.hits.length == 0){
        $scope.show_no_result = true;
      } else {
        $scope.show_no_result = false;
        var i = 0;
        for (; i < results.documents.hits.hits.length; i++){
          $scope.docs.push(results.documents.hits.hits[i]._source);
          try {
            $scope.doc_geometry.push(results.documents.hits.hits[i]._source.polygon.features[0]);
          }
          catch(err){
            console.log(results.documents.hits.hits[i]);
          }
        }
        var ii = 0;
        for (; ii < results.facets.hits.hits.length; ii++){
          if (results.facets.hits.hits[ii]._index == 'watershedsdev'){
            $scope.wtshd_check.push(results.facets.hits.hits[ii]);
          } else if (results.facets.hits.hits[ii]._index == 'usstatesdev'){
            $scope.state_check.push(results.facets.hits.hits[ii]);
          } else if (results.facets.hits.hits[ii]._index == 'triballandsdev'){
            $scope.tblbd_check.push(results.facets.hits.hits[ii]);
          }
        }
        leafletData.getMap().then(function(map){
          var v = 0;
          for (; v < $scope.doc_geometry.length; v++) {
            var newLayer =  L.geoJSON($scope.doc_geometry[v], {
              style: function(feature){
                return {color: "red", weight: 1.5, opacity: 0.2};
              }
            }).bindTooltip (function(layer){
              return layer.feature.properties.NAMELSAD;
            });
            $scope.feature_set.addLayer(newLayer);
          }
          $scope.feature_set.addTo(map);
          map.fitBounds($scope.feature_set.getBounds());
        })
      }})
    }

    $scope.set_facets = function(){
      // Get all checked and redo search - don't store old
      var xx = 0;
      for (;xx < $scope.doc_geometry.length; xx++){
        $scope.cur_doc_geometry.push($scope.doc_geometry[xx]);
      }
      $scope.doc_geometry = [];

      leafletData.getMap().then(function(map){
        $scope.feature_set.clearLayers();
        $scope.watershed_facets.clearLayers();
        $scope.state_facets.clearLayers();
        $scope.tribal_boundary_facets.clearLayers();
      })

      leafletData.getMap().then(function(map){
        if ($scope.geo_facets.watershed.length != 0){
          var wsFacetLayer =  L.geoJSON($scope.geo_facets.watershed._source.features, {
            style: function(feature){
              return {color: "blue", fill: false};
            }
          });
          $scope.watershed_facets.addLayer(wsFacetLayer);
          $scope.watershed_facets.addTo(map);
        }
        if ($scope.geo_facets.state.length != 0){
          var stFacetLayer =  L.geoJSON($scope.geo_facets.state._source.features, {
            style: function(feature){
              return {color: "green", fill: false};
            }
          });
          $scope.state_facets.addLayer(stFacetLayer);
          $scope.state_facets.addTo(map);
        }
        if ($scope.geo_facets.tblbd.length != 0){
          var tbFacetLayer =  L.geoJSON($scope.geo_facets.tblbd._source.features, {
            style: function(feature){
              return {color: "orange", fill: false};
            }
          });
          $scope.tribal_boundary_facets.addLayer(wsFacetLayer);
          $scope.tribal_boundary_facets.addTo(map);
        }
      })
      $scope.facet_search();
    };

    $scope.facet_search = function(){
      $scope.docs = [];
      $scope.waiting = true;
      $scope.show_no_result = false;
      client.search($scope.searchTerm, $scope.geo_facets).then(function(results){
        $scope.waiting = false;
        if (results.documents.hits.hits.length == 0){
          $scope.show_no_result = true;
        } else {
          $scope.show_no_result = false;
          var i = 0;
          for (; i < results.documents.hits.hits.length; i++){
            $scope.docs.push(results.documents.hits.hits[i]._source);
            $scope.doc_geometry.push(results.documents.hits.hits[i]._source.polygon.features[0]);
          }
          leafletData.getMap().then(function(map){
            var vi = 0;
            for (; vi < $scope.doc_geometry.length; vi++) {
              var newLayer =  L.geoJSON($scope.doc_geometry[vi], {
                style: function(feature){
                  return {color: "red", weight: 1.5, opacity: 0.2};
                }
              }).bindTooltip (function(layer){
                return layer.feature.properties.NAMELSAD;
              });
              $scope.feature_set.addLayer(newLayer);
            }
            $scope.feature_set.addTo(map);
            map.fitBounds($scope.feature_set.getBounds());
          })
        }})
      }

      $scope.search();

    }]);

    Nawrs.factory('client', ['esFactory', '$location', '$q', function (esFactory, $location, $q) {
      //var esHostname = location.hostname.concat("/es");
      //console.log(esHostname);
      var client = esFactory({
        //host: 'localhost:9200',
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

      var search = function(term, geo_facets){
        var docs_facets = {};
        var deferred = $q.defer();
        var docIndex = 'nawrsdev';
        var docIndexType = 'item';
        var docSearchString = term;
        var docReturnFields = ['polygon.features', 'title', 'identifier', 'type'];
        var docGeometryField = 'polygon.features.geometry';
        // next variable needs to be parameterized
        //var refIndex = 'watersheds';
        var refIndexType = 'geojson';
        var refReturnField = ['features'];
        var query = {};
        var geoFacetElements = [];
        if (geo_facets.watershed.length == 0 && geo_facets.state.length == 0 && geo_facets.tblbd.length ==0 && docSearchString == ''){
          query = {
            "match_all": {}
          }
        }
        else if ((geo_facets.watershed.length == 0 && geo_facets.state.length == 0 && geo_facets.tblbd.length ==0) && docSearchString != ''){
          query = {
            "query_string": {
              "query": docSearchString
            }
          }
        } else if ((geo_facets.watershed.length != 0 || geo_facets.state.length != 0 || geo_facets.tblbd.length != 0) && docSearchString == ''){
          if (geo_facets.watershed.length != 0){
            var geoFacetElement = {
              "geo_shape": {
                "polygon.features.geometry": {
                  "indexed_shape": {
                    "id": geo_facets.watershed._id,
                    "type": "geojson",
                    "index": "watershedsdev",
                    "path": "features.geometry"
                  }
                }
              }
            }
            geoFacetElements.push(geoFacetElement);
          }
          if (geo_facets.state.length != 0){
            var geoFacetElement = {
              "geo_shape": {
                "polygon.features.geometry": {
                  "indexed_shape": {
                    "id": geo_facets.state._id,
                    "type": "geojson",
                    "index": "usstatesdev",
                    "path": "features.geometry"
                  }
                }
              }
            }
            geoFacetElements.push(geoFacetElement);
          }
          if (geo_facets.tblbd.length != 0){
            var geoFacetElement = {
              "geo_shape": {
                "polygon.features.geometry": {
                  "indexed_shape": {
                    "id": geo_facets.tblbd._id,
                    "type": "geojson",
                    "index": "triballandsdev",
                    "path": "features.geometry"
                  }
                }
              }
            }
            geoFacetElements.push(geoFacetElement);
          }
          query = {
            "bool": {
              "must": [
                geoFacetElements
              ]
            }
          }
        } else {
          if (geo_facets.watershed.length != 0){
            var geoFacetElement = {
              "geo_shape": {
                "polygon.features.geometry": {
                  "indexed_shape": {
                    "id": geo_facets.watershed._id,
                    "type": "geojson",
                    "index": "watershedsdev",
                    "path": "features.geometry"
                  }
                }
              }
            }
            geoFacetElements.push(geoFacetElement);
          }
          if (geo_facets.state.length != 0){
            var geoFacetElement = {
              "geo_shape": {
                "polygon.features.geometry": {
                  "indexed_shape": {
                    "id": geo_facets.state._id,
                    "type": "geojson",
                    "index": "usstatesdev",
                    "path": "features.geometry"
                  }
                }
              }
            }
            geoFacetElements.push(geoFacetElement);
          }
          if (geo_facets.tblbd.length != 0){
            var geoFacetElement = {
              "geo_shape": {
                "polygon.features.geometry": {
                  "indexed_shape": {
                    "id": geo_facets.tblbd._id,
                    "type": "geojson",
                    "index": "triballandsdev",
                    "path": "features.geometry"
                  }
                }
              }
            }
            geoFacetElements.push(geoFacetElement);
          }
          query = {
            "bool": {
              "must": [
                {"match": {
                  "_all": docSearchString
                }},
                geoFacetElements
              ]
            }
          }
        }
        client.search({
          index: docIndex,
          type: docIndexType,
          size: 1000,
          body: {
            _source: docReturnFields,
            query: query
          }
        }).then(function(result){
          docs_facets.documents = result;
          var docIDs = [];
          var i = 0;
          for(; i < result.hits.hits.length; i++){
            docIDs.push(result.hits.hits[i]['_id']);
          };
          var geoQueryElements = [];
          var ii = 0;
          for(; ii < docIDs.length; ii++){
            var geoQueryElement = {
              "geo_shape": {
                "features.geometry": {
                  "indexed_shape": {
                    "id": docIDs[ii],
                    "type": docIndexType,
                    "index": docIndex,
                    "path": docGeometryField
                  }
                }
              }
            }
            geoQueryElements.push(geoQueryElement);
          }
          var spatialQuery = {
            "bool": {
              "should": geoQueryElements
            }
          }
          client.search({
            index: ["watershedsdev", "usstatesdev", "triballandsdev"],
            type: refIndexType,
            size: 1000,
            body: {
              _source: refReturnField,
              query: spatialQuery
            }
          }).then(function(result){
            //console.log(result);
            docs_facets.facets = result;
            var iii = 0, hits_in, hits_out = [];
            hits_in = (result.hits || {}).hits || [];
            for(; iii < hits_in.length; iii++){
              hits_out.push(hits_in[iii]._source);
            }
            deferred.resolve(docs_facets);
          }, deferred.reject)
        })
        return deferred.promise;
      };

      return {
        search: search
      };
    }]);
