var observable = require("tns-core-modules/data/observable");
var observableArray = require("tns-core-modules/data/observable-array");
var frameModule = require("tns-core-modules/ui/frame");
var dialogs = require("tns-core-modules/ui/dialogs");
var bluetooth = require("nativescript-bluetooth");

var DemoAppModel = (function (_super) {
  __extends(DemoAppModel, _super);
  function DemoAppModel() {
    _super.call(this);
  }

  DemoAppModel.prototype.doIsBluetoothEnabled = function () {
    bluetooth.isBluetoothEnabled().then(function(enabled) {
      dialogs.alert({
        title: "Enabled?",
        message: enabled ? "Yes" : "No",
        okButtonText: "OK, thanks"
      });
    });
  };

  DemoAppModel.prototype.doEnableBluetooth = function () {
    bluetooth.enable().then(function(enabled) {
      setTimeout(function() {
        dialogs.alert({
          title: "Did the user allow enabling Bluetooth by our app?",
          message: enabled ? "Yes" : "No",
          okButtonText: "OK, nice!"
        });
      }, 500);
    });
  };

  var observablePeripheralArray = new observableArray.ObservableArray();

  DemoAppModel.prototype.peripherals = observablePeripheralArray;

  DemoAppModel.prototype.onPeripheralTap = function (args) {
    var index = args.index;
    console.log('!!&&&&***** Clicked item with index ' + index);
    var peri = DemoAppModel.prototype.peripherals.getItem(index);
    console.log("--- peri selected: " + peri.UUID);

    var navigationEntry = {
      moduleName: "services-page",
      context: {
        info: "something you want to pass to your page",
        foo: 'bar',
        peripheral: peri
      },
      animated: true
    };
    var topmost = frameModule.topmost();
    topmost.navigate(navigationEntry);
  };

  // this one uses automatic permission handling
  DemoAppModel.prototype.doStartScanning = function () {
    var that = this;

    that.set('isLoading', true);
    // reset the array
    observablePeripheralArray.splice(0, observablePeripheralArray.length);
    bluetooth.startScanning(
      {
        serviceUUIDs: [], // pass an empty array to scan for all services
        seconds: 4, // passing in seconds makes the plugin stop scanning after <seconds> seconds
        onDiscovered: function (peripheral) {
          observablePeripheralArray.push(observable.fromObject(peripheral));
        }
      }
    ).then(function() {
      that.set('isLoading', false);
    },
    function (err) {
      that.set('isLoading', false);
      dialogs.alert({
        title: "Whoops!",
        message: err,
        okButtonText: "OK, got it"
      });
    });
  };

  DemoAppModel.prototype.doStopScanning = function () {
    var that = this;
    bluetooth.stopScanning().then(function() {
      that.set('isLoading', false);
    },
    function (err) {
      dialogs.alert({
        title: "Whoops!",
        message: err,
        okButtonText: "OK, so be it"
      });
    });
  };

  return DemoAppModel;
})(observable.Observable);
exports.DemoAppModel = DemoAppModel;
exports.mainViewModel = new DemoAppModel();
