//var vmModule = require("./main-view-model");
var dialogs = require("tns-core-modules/ui/dialogs");
var observable = require("tns-core-modules/data/observable");
var frameModule = require("tns-core-modules/ui/frame");
var observableArray = require("tns-core-modules/data/observable-array");
var wifiList;

var pageData = new observable.Observable();

function pageLoaded(args) {
    var page = args.object;
    wifiList = page.navigationContext.wifiList;
    var items = new observableArray.ObservableArray(wifiList);
    page.bindingContext = pageData;
    pageData.set("items", items);
}

exports.pageLoaded = pageLoaded;
