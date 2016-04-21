'use strict';

angular.module('educo.activities')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    
    $locationProvider.html5Mode(true);
  }]);