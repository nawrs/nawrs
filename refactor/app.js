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
    result_json: {}
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

  /*$http.get('/data/tl_2011_PR_1hundthDD.geojson').success(function(data, status){
    angular.extend($scope.layers.overlays, {
      tribalbds: {
        name: 'Tribal Boundaries',
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
  })*/

  $scope.selectedPolygon = [];
  $scope.resultshape = {
    "type": "FeatureCollection",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": []
  }
  $scope.resultshape.features = [];

  function onSelect(feature, layer) {
    layer.on({
      click: function() {
        $scope.$apply(function () {
          $scope.selectedFeature = layer.feature.properties.NAME;
          $scope.selectedPolygon = layer.feature.geometry.coordinates[0][0];
          //console.log($scope.selectedPolygon);
          $scope.search('geospatial');
        })
      }
    })
  }

  $scope.changeTiles = function(tiles) {
    $scope.tiles = tilesDict[tiles];
  }

  // Handle search and facet bindings
  var self = this;
  self.tableParams = new NgTableParams({}, { dataset: $scope.docs});

  $scope.searchTerm = $location.search().q || 'water rights';
  $scope.docs = [];
  $scope.doc_type = [];
  $scope.subject = [];
  $scope.facets = [];

  $scope.search = function(search_type){
    var s_type = search_type || 'metadata';
    var q_data = [];
    $scope.docs = [];
    $scope.facets = [];
    if(s_type == 'geospatial'){
      q_data = $scope.selectedPolygon;
    } else {
      q_data = $scope.searchTerm;
    }
    client.search(q_data, $scope.filters, s_type).then(function(results){
      // Push document info, boundaries and metadata facets
      var i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
        $scope.resultshape.features.push(results[1][i].polygon);
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

      // Draw document boundaries and push spatial facets
      /*var xi = 0;
      var latlngs = [];
      for (; xi < results[1].length; xi++){
        var resPoly = results[1][xi].polygon;
        var xii = 0;
        for (; xii < resPoly.features.length; xii++){
          var xiii = 0;
          var polyCoords = resPoly.features[xii].geometry.coordinates[0];
          for (; xiii < polyCoords.length; xiii++){
            var lat = polyCoords[xiii][1];
            var lng = polyCoords[xiii][0];
            latlngs.push([lat, lng]);
          }
        }
      }
      $scope.result_json = {
        // build a new geojson shape featuring all the returned features
        data: $scope.resultshape
      }
      // redraw the map with new bounds from result latlngs
      leafletData.getMap().then(function(map) {
        var polygon = L.polygon(latlngs);
        map.fitBounds(polygon.getBounds());
      });*/
      //
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

  $scope.search('metadata');

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

  var search = function(term, filter_terms, search_type){
    var deferred = $q.defer();
    /*var query = {
    bool: {
    must: [{
    match: {
    _all: term
  }
}
],
filter: filter_terms
}
};*/
var query = {};
if (search_type == 'geospatial'){
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
