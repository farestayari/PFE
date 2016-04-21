'use strict';

angular.module('educo.chats')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
      ;
    $locationProvider.html5Mode(true);
  }]);