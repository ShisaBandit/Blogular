var ngIntroDirective = angular.module("angular-intro", []);
ngIntroDirective.directive("ngIntroOptions", [function() {
    return {
        restrict: "A",
        link: function(n, t, e) {
            n[e.ngIntroMethod] = function(t) {
                if (typeof t == "string") {
                    var o = introJs(t)
                } else {
                    var o = introJs()
                }
                o.setOptions(n.$eval(e.ngIntroOptions));
                if (e.ngIntroOncomplete) {
                    o.oncomplete(n[e.ngIntroOncomplete])
                }
                if (e.ngIntroOnexit) {
                    o.onexit(n[e.ngIntroOnexit])
                }
                if (e.ngIntroOnchange) {
                    o.onchange(n[e.ngIntroOnchange])
                }
                if (e.ngIntroOnbeforechange) {
                    o.onbeforechange(n[e.ngIntroOnbeforechange])
                }
                if (typeof t == "number") {
                    o.goToStep(t).start()
                } else {
                    o.start()
                }
            }
        }
    }
}]);