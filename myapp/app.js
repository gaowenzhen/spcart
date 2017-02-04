var myapp = angular.module('myapp', ["ui.router", "bw.paging", "angularLoad"]);

myapp.run(function($rootScope) {
    //购物车内列表数据
    $rootScope.spcartlist = [];
    $rootScope.codem_promi = "";

});


myapp.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {

    //购物列表
    $stateProvider.state({
        name: "list",
        url: "/list",
        templateUrl: "tlp/list.html",
        controller: "listctrl"
    });

    //购物车列表
    $stateProvider.state({
        name: "spcart",
        url: "/spcart",
        templateUrl: "tlp/spcart.html",
        controller: "spcartctrl"
    });

    //项目教程
    $stateProvider.state({
        name: "Tutorial",
        url: "/Tutorial",
        templateUrl: "tlp/Tutorial.html",
        controller: "Tutorialctrl"
    });


    $urlRouterProvider.otherwise('/list');


}]);

//购物总列表数据
myapp.value('dataall', []);


//myapp.value('gwclist', []);

myapp.service('chraserver', ['$http', function($http) {
    this.getdata = function(urls) {

        return $http.get(urls);
    };

}]);

//头部导航--控制器
myapp.controller('topnavctrol', ['$scope', '$rootScope', function($scope, $rootScope) {


    //购物件数--gwc
    //购物总价数--cont

    $scope.topdata = {
        gwc: 0,
        cont: 0
    };



    //头部监听--（等着接收查看购物车列表里操作时）

    $rootScope.$on("retopdata", function(e, d) {
        $scope.topdata = d;
    });


    //头部监听--（等着接收）创建购物车内数据
    $rootScope.$on("resettopdata", function(evnte, d) {

        //从购物车列表--取出一条数据
        //购物车内列表数据
        var spcartlist = angular.copy($rootScope.spcartlist);
        var newspcartlist = spcartlist.filter(function(itmes) {
            return itmes.id == d.id;
        });

        //购物车列表如果没有这个商品就添加
        if (newspcartlist.length < 1) {
            spcartlist.push(d);
        } else {
            //购物车列表如果有这个商品，就修改商品数量值
            spcartlist.map(function(itme, i) {
                if (itme.id == d.id) {
                    //数量
                    itme.shulian = itme.shulian + 1;
                    //小计
                    itme.xiaoji = itme.shulian * itme.price;
                }
            });
        }

        $rootScope.spcartlist = spcartlist;

        settopdata();
    });





    //统计购物车内总数和购物条数
    var settopdata = function() {

        var getmydata = mydataall.get("mydata");


        //价格总金额
        var cont = 0,
            gwc = 0;

        //取出购物车列表，来遍历，统计
        var spcartlist = angular.copy($rootScope.spcartlist);
        for (var i = 0; i < spcartlist.length; i++) {
            var itmes = spcartlist[i];
            var price = itmes.price;
            var suncont = parseInt(price) * parseInt(itmes.shulian);
            cont = cont + suncont;
            gwc = gwc + itmes.shulian;

            if (getmydata) {

                for (var mi = 0; mi < getmydata.length; mi++) {
                    var itemgetmyap = getmydata[mi];
                    if (itemgetmyap.id == itmes.id) {

                        itemgetmyap.shulian = itmes.shulian;
                        break;
                    }
                }

            }

        }

        //总金额         
        $scope.topdata.cont = cont;
        //件数
        $scope.topdata.gwc = gwc;

        mydataall.put("mydata", getmydata);
        $rootScope.$emit("relist", "");

    }



}]);


var mydataall = "";

//商品列表控制器
myapp.controller('listctrl', ['$scope', 'chraserver', '$rootScope', '$log', '$filter', 'angularLoad', '$q', '$cacheFactory', function($scope, chraserver, $rootScope, $log, $filter, angularLoad, $q, $cacheFactory) {

    $scope.list = [];

    //分页用法
    $scope.Pag_ing = {
        page: 1,
        pagesize: 3,
        total: 10
    };

    //更新分页列表
    var newpagelist = function(size, to_page) {
        var pagedataall = mydataall.get("mydata");
        var red = angular.copy(pagedataall);
        var _newpagelist = $filter("limitTo")(red, size, to_page);
        // console.dir(_newpagelist);
        $scope.list = _newpagelist;
    }

    //-----------------------------


    if (mydataall == "" || typeof mydataall == "undefined") {
        mydataall = $cacheFactory("dataall");
    }

    var getmydata = mydataall.get("mydata");
    //防止多次请求服务端
    if (!getmydata) {
        var josndata = chraserver.getdata('data.json');
        josndata.then(function(res) {
            if (res.statusText == "OK") {

                var dataall = res.data;
                dataall.map(function(itmes, i) {
                    itmes["shulian"] = 0;
                });

                mydataall.put("mydata", dataall);
                getmydata = mydataall.get("mydata");

                //数据，每页大小，开始提取数组位置
                newpagelist($scope.Pag_ing.pagesize, 0);
            }
        });
    } else {

        newpagelist($scope.Pag_ing.pagesize, 0);

    }

    //添加购物车
    $scope.addtoplist = function(id) {

        //从总列表
        var list = angular.copy($scope.list);
        var newlist = list.filter(function(itmes) {
            return itmes.id == id;
        });


        if (newlist.length > 0) {
            //时间戳做订单id--ode_id
            var _d = new Date();
            var timestamp = Date.parse(_d) + _d.getMilliseconds();

            //补字段，订单字段，小计字段，数量字段
            //订单id
            newlist[0].ode_id = timestamp + "_" + id;
            //数量
            newlist[0].shulian = 1;
            //小计
            newlist[0].xiaoji = newlist[0].price;


            $rootScope.$emit("resettopdata", newlist[0]);

        }
    };

    //-----------------------



    //点击分页按钮时
    $scope.DoCtrlPagingAct = function(text, page, pageSize, total) {


        //当前页page
        //每页条数pageSize
        //p_to_p数组内开始位置
        var p_to_p = (page - 1) * pageSize;
        //数据，每页大小，开始提取数组位置
        newpagelist(pageSize, p_to_p);

    };



    //更新列表点击添加数量
    $rootScope.$on("relist", function(e, redata) {
        var newpage = $scope.Pag_ing.page;
        if (newpage > 0) {
            newpage = newpage - 1;
        };
        newpagelist($scope.Pag_ing.pagesize, newpage);
    });


    angularLoad.loadCSS('//cdn.bootcss.com/codemirror/5.22.0/codemirror.min.css').then(function() {

        angularLoad.loadCSS('//cdn.bootcss.com/codemirror/5.22.0/theme/blackboard.min.css').then(function() {

            angularLoad.loadScript('//cdn.bootcss.com/codemirror/5.22.0/codemirror.min.js').then(function() {

                angularLoad.loadScript('//cdn.bootcss.com/codemirror/5.22.0/mode/javascript/javascript.min.js').then(function() {

                    var codem_promises = $q.defer();
                    codem_promises.resolve();
                    $rootScope.codem_promi = codem_promises.promise;

                });


            });

        });

    });

}]);

//购物车列表
myapp.controller('spcartctrl', ['$scope', '$rootScope', function($scope, $rootScope) {

    $scope.spcartlist = angular.copy($rootScope.spcartlist);

    $scope.del = function(id) {
        var newspcartlist = angular.copy($scope.spcartlist);
        newspcartlist.map(function(itmes, i) {

            if (itmes.id == id) {
                newspcartlist.splice(i, 1);
            }

        });



        $scope.spcartlist = newspcartlist;


        $scope.resetshulian();
    }

    //购物车列表内修改数量
    $scope.resetshulian = function() {

        var newspcartlist = angular.copy($scope.spcartlist);

        //总价
        var tjzj = 0;
        //件数量
        var jsconet = 0;
        newspcartlist.map(function(itmes, i) {
            //数量*单价
            var xj = itmes.shulian * itmes.price;
            //写入到小计内
            itmes.xiaoji = xj;
            //累计数量
            jsconet = jsconet + itmes.shulian;
            //累计，总计                     
            tjzj = tjzj + itmes.xiaoji;
        });

        $scope.spcartlist = newspcartlist;
        $rootScope.spcartlist = newspcartlist;
        var topdata = {
            gwc: jsconet,
            cont: tjzj
        };
        $rootScope.$emit("retopdata", topdata);

    }

}]);


myapp.controller('Tutorialctrl', ['$scope', '$rootScope', function($scope, $rootScope) {

    var codem_promi = $rootScope.codem_promi;

    codem_promi.then(function() {


        var CodeMirrorcofig = {
            lineNumbers: true,
            lineWrapping: true,
            theme: "blackboard",
            mode: "text/javascript",
            readOnly: true
        };

        var htmlcofig = {
            lineNumbers: true,
            lineWrapping: true,
            theme: "blackboard",
            mode: "text/html",
            readOnly: true
        };


        CodeMirror.fromTextArea(document.getElementById("code0"), CodeMirrorcofig);

        CodeMirror.fromTextArea(document.getElementById("code1"), CodeMirrorcofig);

        CodeMirror.fromTextArea(document.getElementById("code2"), CodeMirrorcofig);


        CodeMirror.fromTextArea(document.getElementById("code3"), htmlcofig);

        CodeMirror.fromTextArea(document.getElementById("code4"), CodeMirrorcofig);

        CodeMirror.fromTextArea(document.getElementById("code5"), htmlcofig);

        CodeMirror.fromTextArea(document.getElementById("index"), htmlcofig);

        CodeMirror.fromTextArea(document.getElementById("topnavctrol"), CodeMirrorcofig);


        CodeMirror.fromTextArea(document.getElementById("code6"), CodeMirrorcofig);


    });

}]);
