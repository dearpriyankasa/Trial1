var dialogs = require("tns-core-modules/ui/dialogs");
//var bluetooth = require("nativescript-bluetooth");
import { Bluetooth } from "nativescript-bluetooth";
var observable = require("tns-core-modules/data/observable");
var frameModule = require("tns-core-modules/ui/frame");
var observableArray = require("tns-core-modules/data/observable-array");

var wifiNameArray = new String();
var wifiSsidArray = new String();
var wifiList = [];
var k=0;
var bluetooth = new Bluetooth();

function pageLoaded(args) {
    var page = args.object;
    // the Observable-wrapped objects from the previous page
    var peripheral = page.navigationContext.peripheral;
    var service = page.navigationContext.service;
    service.peripheral = peripheral;
    page.bindingContext = service;
}

function bufferToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


function onCharacteristicTap(args) {
  var index = args.index;
  var page = args.object;
  var service = page.bindingContext;
  var characteristic = service.characteristics[index];
  var array = new Uint8Array(20);
  array = [32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

  // show an actionsheet which contains the most relevant possible options
  var p = characteristic.properties;
  var actions = [];

  if (p.read) actions.push("read");
  if (p.write) actions.push("write");
  if (p.write) actions.push("write 0x01"); // convenience method, will write hex 1, translated to a binary 1
  if (p.write) actions.push("write bytearray");
  if (p.writeWithoutResponse) actions.push("writeWithoutResponse");
  if (p.notify) actions.push("notify start");
  if (p.notify) actions.push("notify stop");

  dialogs.action({
    message: "Pick a property",
    cancelButtonText: "Cancel",
    actions: actions
  }).then(function (result) {
    function getTimestamp() {
      return new Date().toLocaleString();
    }

    if (result === "read") {
      bluetooth.read({
        peripheralUUID: service.peripheral.UUID,
        serviceUUID: service.UUID,
        characteristicUUID: characteristic.UUID
      }).then(function (result) {
        // result.value is an ArrayBuffer. Every service has a different encoding.
        // fi. a heartrate monitor value can be retrieved by:
        //   var data = new Uint8Array(result.value);
        //   var heartRate = data[1];
        console.log("peripheralUUID is",peripheralUUID);
        console.log("serviceUUID is",serviceUUID);
        console.log("characteristicUUID is",characteristicUUID);
        var data = new Uint8Array(result.value);
        console.log(data);
        service.set("feedback", data);
        service.set("feedbackRaw", result.valueRaw);
        service.set("feedbackTimestamp", getTimestamp());
      }, function(error) {
        service.set("feedback", error);
        service.set("feedbackTimestamp", getTimestamp());
      });
    } else if (result === "write") {
      dialogs.prompt({
        title: "Write what exactly?",
        message: "Please enter byte values; use 0x in front for hex and send multiple bytes by adding commas. For example 0x01 or 0x007F,0x006E",
        cancelButtonText: "Cancel",
        okButtonText: "Write it!"
      }).then(function(response) {
        if (response.result) {
          bluetooth.write({
            peripheralUUID: service.peripheral.UUID,
            serviceUUID: service.UUID,
            characteristicUUID: characteristic.UUID,
            value: response.text
          }).then(function (result) {
            service.set("feedback", 'value written');
            service.set("feedbackTimestamp", getTimestamp());
          },
          function (errorMsg) {
            service.set("feedback", errorMsg);
            service.set("feedbackTimestamp", getTimestamp());
          });
        }
      });
    } else if (result === "write 0x01") {
      bluetooth.write({
        peripheralUUID: service.peripheral.UUID,
        serviceUUID: service.UUID,
        characteristicUUID: characteristic.UUID,
        value: '0x01'
      }).then(function (result) {
        console.log(service.peripheral.UUID);
        console.log(service.UUID);
        console.log(characteristic.UUID);
        service.set("feedback", 'value written');
        service.set("feedbackTimestamp", getTimestamp());
      },
      function (errorMsg) {
        service.set("feedback", errorMsg);
        service.set("feedbackTimestamp", getTimestamp());
      });
    } else if (result === "write bytearray") {
        bluetooth.write({
          peripheralUUID: service.peripheral.UUID,
          serviceUUID: service.UUID,
          characteristicUUID: characteristic.UUID,
          value: array
        }).then(function (result) {
          service.set("feedback", 'value written');
          service.set("feedbackTimestamp", getTimestamp());
        },
        function (errorMsg) {
          service.set("feedback", errorMsg);
          service.set("feedbackTimestamp", getTimestamp());
        });
      } else if (result === "writeWithoutResponse") {
      dialogs.prompt({
        title: "Write what exactly?",
        message: "Please enter byte values; use 0x in front for hex and send multiple bytes by adding commas. For example 0x01 or 0x007F,0x006E",
        cancelButtonText: "Cancel",
        okButtonText: "Write it!"
      }).then(function(response) {
        if (response.result) {
          bluetooth.writeWithoutResponse({
            peripheralUUID: service.peripheral.UUID,
            serviceUUID: service.UUID,
            characteristicUUID: characteristic.UUID,
            value: response.text
          }).then(function (result) {
            service.set("feedback", 'value write requested');
            service.set("feedbackTimestamp", getTimestamp());
          });
        }
      });
    } else if (result === "notify start") {
      bluetooth.startNotifying({
        peripheralUUID: service.peripheral.UUID,
        serviceUUID: service.UUID,
        characteristicUUID: characteristic.UUID,
        onNotify: function(result) {
          flag=1;
          var data = new Uint8Array(result.value);

          var data1 = new Uint8Array(data.length-6);
          var j=0;
          for(var i=6;i<data.length;i++) {
            data1[j] = data[i];
            j++;
          }
          data.toString();
          wifiNameArray[k] = bufferToString(data1);
          wifiSsidArray[k] = data[4];
          wifiList.push({name: wifiNameArray[k], ssid: wifiSsidArray[k]});
          //console.log(data);
          //console.log(data1);
          //console.log(wifiNameArray[k]);
          //console.log(wifiSsidArray[k]);
          //console.log(wifiList[k].name);
          //console.log(wifiList[k].ssid);
          service.set("feedback", wifiNameArray[k]);
          k++;
          service.set("feedbackRaw", result.valueRaw);
          service.set("feedbackTimestamp", getTimestamp());
        }
      }).then(function (result) {
        service.set("feedback", 'subscribed for notifications');
        service.set("feedbackTimestamp", getTimestamp());
      });
    } else if (result === "notify stop") {
      bluetooth.stopNotifying({
        peripheralUUID: service.peripheral.UUID,
        serviceUUID: service.UUID,
        characteristicUUID: characteristic.UUID
      }).then(function (result) {
        service.set("feedback", 'notification stopped');
        service.set("feedbackTimestamp", getTimestamp());
        var navigationEntry = {
            moduleName: "list-page",
            context: {
              wifiList: wifiList
            },
            animated: true
          };
          var topmost = frameModule.topmost();
          topmost.navigate(navigationEntry);
      }, function(error) {
        service.set("feedback", error);
      });
    }
  });
}

exports.pageLoaded = pageLoaded;
exports.onCharacteristicTap = onCharacteristicTap;
