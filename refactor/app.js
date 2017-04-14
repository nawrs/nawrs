//'use strict';

window.Nawrs = angular.module('nawrs', ['ui-leaflet', 'elasticsearch', 'ngTable']);

// the application
Nawrs.controller('geoSearch', ['$scope', 'client', 'esFactory', '$location', 'NgTableParams', function ($scope, client, esFactory, $location, NgTableParams) {

  var self = this;
  self.tableParams = new NgTableParams({}, { dataset: $scope.docs});

  $scope.searchTerm = $location.search().q || ' ';
  $scope.docs = [];
  $scope.doc_type = [];
  $scope.subject = [];
  $scope.filters = [];
  $scope.hold_filters = [];
  $scope.faceted_search = function(bucket, filter_term){
    // do stuff here - get checked boxes and parse into
    // query filters
  };

  $scope.search = function(){
    $scope.docs = [];
    $scope.filters = [];
    $scope.hold_filters = [];
    client.search($scope.searchTerm, $scope.filters).then(function(results){
      //console.log(results);
      i = 0;
      for (; i < results[1].length; i++){
        $scope.docs.push(results[1][i]);
      }
      //console.log($scope.docs);
      $scope.doc_type = results[0].doc_type.buckets;
      $scope.subject = results[0].subject.buckets;
    })
  }

  // todo: bind to checkboxes, on change get all checked boxes
  // and build filters our of an array of checked facets
  $scope.facet = function(bucket, filter_term){
    var ii = 0;
    $scope.category = bucket;
    $scope.docs = [];
    $scope.filters = [{
      "term": {
        [bucket]: filter_term
      }
    }
  ];
  for (; ii < $scope.hold_filters.length; ii++){
    $scope.filters.push($scope.hold_filters[i]);
  }
  console.log($scope.filters)
  client.search($scope.searchTerm, $scope.filters).then(function(results){
    //console.log(results);
    i = 0;
    for (; i < results[1].length; i++){
      $scope.docs.push(results[1][i]);
    }
    //console.log($scope.docs);
    $scope.doc_type = results[0].doc_type.buckets;
    $scope.subject = results[0].subject.buckets;
  })
  $scope.hold_filters = [];
  var iii = 0;
  for (; iii < $scope.filters.length; iii++){}
}

$scope.search();

}]);

Nawrs.factory('client', ['esFactory', '$location', '$q', function (esFactory, $location, $q) {
  //var es =  require('elasticsearch');
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
    //var filter = [filter_terms];
    //console.log(filter_terms)
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
  //console.log(query);
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
    //console.log(result.hits);
    //console.log(result.aggregations);
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
