'use strict';

angular.module('nawrsapp', ['ui-leaflet', 'elasticsearch'])

.controller('ElasticsearchHealthcheck', function($scope, elasticClient) {
  elasticClient.cluster.health(function (err, resp) {
    if (err) {
      console.error(err.message);
    } else {
      $scope.name = resp.cluster_name;
      $scope.status = resp.status;
    }
  });
})

.controller('ElasticMapQuery', [ '$scope', 'elasticClient', function($scope, elasticClient){

  var queryTerm = 'navajo';

  angular.extend($scope, {
    elasticcentroid: {
      // placeholder property
      lat: 39.5,
      lng: -98.35,
      zoom: 4
    },
    defaults: {
      scrollWheelZoom: false
    }
  })

  elasticClient.search({
    index: 'nawrs',
    type: 'item',
    body: {
      query: {
        match: {
          title: queryTerm
        }
      }
    }
  }).then(function (resp){
    $scope.docdata = [];
    $scope.totalhits = resp.hits.total;
    $scope.datadump = resp.hits.hits[0];
    $scope.docdesc = 'Sample description: ' + resp.hits.hits[0]._source.description[0];
    angular.forEach(resp.hits.hits, function(data){
      angular.forEach(data, function(){
        var doctitle = data._source.title;
        var doclink = data._source.identifier;
        //console.log(tweetdata);
        $scope.docdata.push({doctitle});
        $scope.docdata.push({doclink});
      });
    });
    angular.extend($scope, {
      elasticjson: {
        data: resp.hits.hits[0]._source.polygon,
      }
    })
    angular.extend($scope, {
      elasticcentroid: {
        lat: resp.hits.hits[0]._source.centroid.features[0].geometry.coordinates[1],
        lng: resp.hits.hits[0]._source.centroid.features[0].geometry.coordinates[0],
        zoom: 8
      }
    })
    }, function(err){
      console.trace(err.message)
    });
  }])

  .factory('elasticClient', ['esFactory', function(esFactory) {
    return esFactory({
      host: 'localhost:9200',
      sniffOnStart: true,
      sniffInterval: 300000
    });
  }]);
