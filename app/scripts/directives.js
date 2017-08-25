'use strict';

/**
 * @ngdoc function
 * @name amvGeolocationUi.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the amvGeolocationUi
 */
angular.module('amvGeolocationUi')
  .directive('materializeModal', [function () {
    return {
      transclude: true,
      scope: {
        id: '@id',
        headerText: '@headerText'
      },
      templateUrl: 'views/directives/materialize-modal.html'
    };
  }])
  .directive('materializeModalActivator', ['$window', '$compile', '$timeout', function ($window, $compile, $timeout) {
    var $ = $window.$;
    return {
      scope: {
        dismissible: '=',
        opacity: '@',
        inDuration: '@',
        outDuration: '@',
        startingTop: '@',
        endingTop: '@',
        ready: '&?',
        complete: '&?',
        open: '=?',
        enableTabs: '@?'
      },
      link: function (scope, element, attrs) {
        $timeout(function () {
          var modalEl = $(attrs.href ? attrs.href : '#' + attrs.target);
          $compile(element.contents())(scope);

          var complete = function () {
            if (angular.isFunction(scope.complete)) {
              scope.$apply(scope.complete);
            }

            scope.open = false;
            scope.$apply();
          };
          var ready = function () {
            if (angular.isFunction(scope.ready)) {
              scope.$apply(scope.ready);
            }
            // Need to keep open boolean in sync.
            scope.open = true;
            scope.$apply();

            // If tab support is enabled we need to re-init the tabs
            // See https://github.com/Dogfalo/materialize/issues/1634
            if (scope.enableTabs) {
              modalEl.find('ul.tabs').tabs();
            }
          };
          var options = {
            dismissible: (angular.isDefined(scope.dismissible)) ? scope.dismissible : undefined,
            opacity: (angular.isDefined(scope.opacity)) ? scope.opacity : undefined,
            inDuration: (angular.isDefined(scope.inDuration)) ? scope.inDuration : undefined,
            outDuration: (angular.isDefined(scope.outDuration)) ? scope.outDuration : undefined,
            startingTop: (angular.isDefined(scope.startingTop)) ? scope.startingTop : undefined,
            endingTop: (angular.isDefined(scope.endingTop)) ? scope.endingTop : undefined,
            ready: ready,
            complete: complete,
          };
          modalEl.modal(options);
          element.modal(options);

          // Setup watch for opening / closing modal programatically.
          if (angular.isDefined(attrs.open) && modalEl.length > 0) {
            scope.$watch('open', function (value) {
              if (!angular.isDefined(value)) {
                return;
              }
              if (value === true) {
                modalEl.modal('open');
              } else {
                modalEl.modal('close');
              }
            });
          }
        });
      }
    };
  }])

  .directive('materializeTooltipped', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        var rmDestroyListener = Function.prototype; //assigning to noop

        function init() {
          element.addClass('tooltipped');
          $compile(element.contents())(scope);

          $timeout(function () {
            // https://github.com/Dogfalo/materialize/issues/3546
            // if element.addClass('tooltipped') would not be executed, then probably this would not be needed
            if (element.attr('data-tooltip-id')) {
              element.tooltip('remove');
            }
            element.tooltip();
          });
          rmDestroyListener = scope.$on('$destroy', function () {
            element.tooltip('remove');
          });
        }

        attrs.$observe('tooltipped', function (value) {
          if (value === 'false' && rmDestroyListener !== Function.prototype) {
            element.tooltip('remove');
            rmDestroyListener();
            rmDestroyListener = Function.prototype;
          } else if (value !== 'false' && rmDestroyListener === Function.prototype) {
            init();
          }
        });

        if (attrs.tooltipped !== 'false') {
          init();
        }

        // just to be sure, that tooltip is removed when somehow element is destroyed, but the parent scope is not
        element.on('$destroy', function () {
          element.tooltip('remove');
        });

        scope.$watch(function () {
          return element.attr('data-tooltip');
        }, function (oldVal, newVal) {
          if (oldVal !== newVal && attrs.tooltippify !== 'false') {
            $timeout(function () {
              element.tooltip();
            });
          }
        });

      }
    };
  }]);
