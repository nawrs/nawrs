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
