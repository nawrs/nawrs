'use strict';

angular.module('nawrsapp', ['ui-leaflet', 'elasticsearch'])

.controller("GeoJSONController", [ '$scope', '$http', function($scope, $http) {
  angular.extend($scope, {
    grants: {
      lat: 35,
      lng: -108,
      zoom: 8
    },
    defaults: {
      scrollWheelZoom: false
    }
  });

  // Get the countries geojson data from a JSON
  $http.get("data/Acoma.geojson").success(function(data, status) {
    angular.extend($scope, {
      geojson: {
        data: data,
        style: {
          fillColor: "orange",
          weight: 2,
          opacity: 1,
          color: 'orange',
          dashArray: '1',
          fillOpacity: 0.3
        }
      }
    });
  });
}])

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

.controller('ElasticsearchQuery', function($scope, elasticClient){
  elasticClient.search({
    index: 'tweets',
    type: 'tweet',
    body: {
      query: {
        match: {
          text: 'Trump'
        }
      }
    }
  }).then(function (resp) {
    //console.log('Query success')
    $scope.tweets = [];
    $scope.totalhits = resp.hits.total;
    $scope.datadump = resp.hits.hits[0];
    $scope.tweettext = resp.hits.hits[0]._source.text;
    angular.forEach(resp.hits.hits, function(data){
      angular.forEach(data, function(){
        var tweetdata = data._source.text;
        //console.log(tweetdata);
        $scope.tweets.push({tweetdata});
      });
    });
    $scope.numtweets = $scope.tweets.length;
}, function (err) {
  console.trace(err.message);
});
})

.factory('elasticClient', ['esFactory', function(esFactory) {
  return esFactory({
    host: 'localhost:9200',
    sniffOnStart: true,
    sniffInterval: 300000
  });
}]);
