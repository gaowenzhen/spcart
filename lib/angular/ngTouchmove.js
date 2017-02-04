"use strict";
//自定义--指令，提供移动端触摸
angular.module("ngTouchmove", []).directive("ngTouchmove", function() {
    return {
        controller: function($scope, $element, $attrs) {
            //进入移动端时监听touchstart事件
            $element.bind('touchstart', onTouchStart);

            function onTouchStart(event) {
                //event.preventDefault();
                var method = $element.attr('ng-touchstart');
                $scope.$startevent = event;
                $scope.$apply(method);
                $element.bind('touchmove', onTouchMove);
                $element.bind('touchend', onTouchEnd);

            };

            function onTouchMove(event) {
                var method = $element.attr('ng-touchmove');
                $scope.$event = event;
                $scope.$apply(method);
            };

            function onTouchEnd(event) {
                //event.preventDefault();
                $element.unbind('touchmove', onTouchMove);
                $element.unbind('touchend', onTouchEnd);
            };
        }
    };
});
