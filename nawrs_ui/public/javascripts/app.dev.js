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

    // TODO: geojson files below will not be used for faceting, re-purpose as reference layers
    // Begin GeoJSON bindings for beta facets, including show/hide buttons

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

  /*$scope.show_watersheds = false;
  $scope.set_watersheds_visible = "Show Watershed Filters"

  $scope.show_ws = function(){
    if ($scope.show_watersheds == false){
      $scope.show_watersheds = true;
      $scope.set_watersheds_visible = "Hide Watershed Filters"
    } else if ($scope.show_watersheds == true) {
      $scope.show_watersheds = false;
      $scope.set_watersheds_visible = "Show Watershed Filters"
    }

  }

  $scope.show_states = false;
  $scope.set_states_visible = "Show State Filters"

  $scope.show_st = function(){
    if ($scope.show_states == false){
      $scope.show_states = true;
      $scope.set_states_visible = "Hide State Filters"
    } else if ($scope.show_states == true) {
      $scope.show_states = false;
      $scope.set_states_visible = "Show State Filters"
    }

  }

  $scope.show_boundaries = false;
  $scope.set_boundaries_visible = "Show Tribal Boundary Filters"

  $scope.show_bds = function(){
    if ($scope.show_boundaries == false){
      $scope.show_boundaries = true;
      $scope.set_boundaries_visible = "Hide Tribal Boundary Filters"
    } else if ($scope.show_boundaries == true) {
      $scope.show_boundaries = false;
      $scope.set_boundaries_visible = "Show Tribal Boundary Filters"
    }

  }*/

    // end GeoJSON bindings for facets

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


    // refactoring facets
    // bind geometries returned by search to checkbox (single selection)
    $scope.state_check = [];
    $scope.wtshd_check = [];
    $scope.tblbd_check = [];

    $scope.set_wtshd = function(){
	//console.log($scope.geo_facets.watershed);
	$scope.geo_facets.watershed.refIndexType = "watersheds";
	$scope.set_facets();
    }

    $scope.set_state = function(){
	$scope.geo_facets.state.refIndexType = "usstates";
	$scope.set_facets();
    }

    $scope.set_tblbd = function(){
	$scope.geo_facets.tblbd.refIndexType = "triballands";
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

	client.search($scope.searchTerm, $scope.geo_facets).then(function(results){
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
	      if (results.facets.hits.hits[ii]._index == 'watersheds'){
		  $scope.wtshd_check.push(results.facets.hits.hits[ii]);
	      } else if (results.facets.hits.hits[ii]._index == 'usstates'){
		  $scope.state_check.push(results.facets.hits.hits[ii]);
	      } else if (results.facets.hits.hits[ii]._index == 'triballands'){
		  $scope.tblbd_check.push(results.facets.hits.hits[ii]);
	      }
	  }
      leafletData.getMap().then(function(map){
        var v = 0;
        for (; v < $scope.doc_geometry.length; v++) {
          //$scope.doc_geometry[v].selected = true;
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
      $scope.doc_geometry = [];
      
    leafletData.getMap().then(function(map){
      $scope.feature_set.clearLayers();
      $scope.watershed_facets.clearLayers();
      $scope.state_facets.clearLayers();
      $scope.tribal_boundary_facets.clearLayers();
    })
      
      leafletData.getMap().then(function(map){
	  console.log($scope.geo_facets);
	  if ($scope.geo_facets.watershed.length != 0){
	      console.log($scope.geo_facets.watershed);
          var wsFacetLayer =  L.geoJSON($scope.geo_facets.watershed._source.features, {
            style: function(feature){
              return {color: "blue"};
            }
          });
          $scope.watershed_facets.addLayer(wsFacetLayer);
              $scope.watershed_facets.addTo(map);
	  }
	  if ($scope.geo_facets.state.length != 0){
	  var stFacetLayer =  L.geoJSON($scope.geo_facets.state._source.features, {
	      style: function(feature){
		  return {color: "green"};
	      }
	  });
	  $scope.state_facets.addLayer(stFacetLayer);
	      $scope.state_facets.addTo(map);
	  }
	  if ($scope.geo_facets.tblbd.length != 0){
	  var tbFacetLayer =  L.geoJSON($scope.geo_facets.tblbd._source.features, {
	      style: function(feature){
		  return {color: "orange"};
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
      client.search($scope.searchTerm, $scope.geo_facets).then(function(results){
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

    $scope.search();

}]);

Nawrs.factory('client', ['esFactory', '$location', '$q', function (esFactory, $location, $q) {
  var esHostname = location.hostname.concat("/es");
  //console.log(esHostname);
  var client = esFactory({
    host: esHostname,
    //host: 'compute.karlbenedict.com/es',
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
	var docIndex = 'nawrs';
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
				"index": "watersheds",
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
				"index": "usstates",
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
				"index": "triballands",
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
				"index": "watersheds",
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
				"index": "usstates",
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
				"index": "triballands",
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
	//console.log(query)
    client.search({
	index: docIndex,
	type: docIndexType,
	size: 1000,
	body: {
	    _source: docReturnFields,
	    query: query
	}
    }).then(function(result){
	//console.log(result)
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
	//console.log(geoQueryElements);
	//console.log(spatialQuery);
	client.search({
	    index: ["watersheds", "usstates", "triballands"],
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
