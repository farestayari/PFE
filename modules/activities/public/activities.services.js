'use strict';

angular.module('educo.activities')
  .factory('appActivities', ['$resource',
    function($resource) {
      return $resource('activities/feed/:userId', {
            userId: '@_id'
        });
    }
  ])
  ;
  