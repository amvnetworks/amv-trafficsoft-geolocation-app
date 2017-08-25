/* jshint loopfunc:true */
'use strict';

/**
 * @ngdoc function
 * @name amvGeolocationUi.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the amvGeolocationUi
 */
angular.module('amvGeolocationUi')
  .controller('MainCtrl', ['$scope', '$log',
    'Materialize', 'amvClientSettings', 'amvXfcdClient',
    function ($scope, $log, Materialize, amvClientSettings, amvXfcdClient) {
    var self = this;

    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    this.map = {
      center: {
        lat: 49,
        lng: 10,
        //zoom: 5
        zoom: 3
      },
      markers: [],
      events: {},
      defaults: {
        scrollWheelZoom: true,
        center: {
          lat: 49,
          lng: 10,
          zoom: 5
        }
      },
      tiles: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      },
      controls: {
        fullscreen: {
          position: 'topleft'
        }
      }
    };

    $scope.$watch(function () {
      return self.map.center.zoom;
    }, function (zoom) {
      self.map.tiles.url = (zoom > 6) ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    });

    var createMarkerForGeolocation = function (geolocation) {

      var markerMessage = '<div>' +
        '<h6>' + geolocation.name + '</h6>' +
        '<small>' +
        '<i class="material-icons tiny">room</i> lat/lng: ' + geolocation.location.lat + ' / ' + geolocation.location.lng +
        '</small>' +
        '<br />' +
        '<small>' +
         ' <i class="material-icons tiny">av_timer</i> speed: ' + (geolocation.data.speed || 0) + ' km/h' +
        '</small>' +
        '<br />' +
        '<span>' +
        //'' + geolocation.condition.temperature +
        '</span><br />' +
        //'<span>' + geolocation.condition.state + '</span><br />' +
        '<small><i class="material-icons tiny">router</i> Data Provider: ' + geolocation.provider + '</small><br />' +
        '<small><i class="material-icons tiny">query_builder</i> Request Time: ' + geolocation.requestTime + '</small><br />' +
        '<small><i class="material-icons tiny">query_builder</i> Position Time: ' + geolocation.data.timestamp + '</small>' +
        '</div>';

      return {
        lat: geolocation.location.lat,
        lng: geolocation.location.lng,
        message: markerMessage,
        draggable: false,
        //focus: true,
        icon: {
          //iconUrl: markerIconUrl,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          popupAnchor: [0, 0]
        }
      };
    };

    var addMarkerForGeolocationToMap = function (geolocation) {
      var hasLocationData = !!(geolocation.location &&
        geolocation.location.lat &&
        geolocation.location.lng);
        if (hasLocationData) {
          var marker = createMarkerForGeolocation(geolocation);
          self.map.markers.push(marker);
        }
    };

    $scope.$on('leafletDirectiveMap.mymap.click', function (event, args) {
      var leafEvent = args.leafletEvent;
      var positionClicked = {
        location: {
          lat: leafEvent.latlng.lat,
          lng: leafEvent.latlng.lng
        }
      };
      $log.log('clicked ' + positionClicked);
    });


    function apiResponseToGeolocation(data) {
      return {
        name: data.id,
        location: {
          lat: data.latitude,
          lng: data.longitude
        },
        provider: 'amv networks',
        requestTime: Date.now(),
        date: Date.now(),
        data: data
      };
    }

    $scope.zoomToLocation = function (geolocation, level) {
      var zoomLevel = level > 0 ? level : 11;
      var location = geolocation.location;
      var hasLocationData = !!(location &&
        location.lat &&
        location.lng);
      if (!hasLocationData) {
        Materialize.toast('No location data available for ' + geolocation.name, 2000);
      } else {
        Materialize.toast('Zoom to ' + geolocation.name, 1000);
        self.map.center = {
          lat: location.lat,
          lng: location.lng,
          zoom: zoomLevel
        };
      }
    };

    (function init() {

      $scope.loading = true;
      $scope.locations = [];

      amvClientSettings.get().then(function(settings) {
        self.settings = settings;
        return settings.api || {};
      }).then(function(apiSettings) {
       return apiSettings.options.vehicleIds || [];
     }).then(function(vehicleIds) {
        amvXfcdClient.get().then(function(client) {
            return client.getLastData(vehicleIds);
        }).then(function(response) {
          $log.log('ok, got data');

          var hasNoData = !response.data || response.data.length === 0;
          if (hasNoData) {
            Materialize.toast('Response contains empty data!', 2000);
          } else {
            var dataArray = response.data;
            dataArray.forEach(function(data) {
              var position = apiResponseToGeolocation(data);

              $scope.locations.push(position);
              addMarkerForGeolocationToMap(position);
            });

            Materialize.toast('Finished loading ' + dataArray.length + ' location(s)', 1000);
          }
        }).catch(function(e) {
          $log.log('error, while getting data');
          $log.log(e);

          var isAmvException = e && e.response && e.response.data && e.response.data.message;
          var errorMessage = isAmvException ? e.response.data.message : e;
          Materialize.toast(errorMessage, 4000);
          Materialize.toast('Please check your settings.', 5000);
        }).finally(function() {
          $scope.loading = false;
        });
      }).catch(function(e) {
        $log.log(e);
        $scope.loading = false;
        Materialize.toast('Please check your settings.', 3000);
      });

    })();
  }]);
