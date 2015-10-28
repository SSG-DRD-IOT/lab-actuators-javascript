/*
 * Author: Daniel Holmlund <daniel.w.holmlund@Intel.com>
 * Copyright (c) 2015 Intel Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var config = require("../../config.json");

// Require the MQTT connections
var mqtt = require('mqtt');
var client  = mqtt.connect(config.mqtt.url);

// Require the Winston Logger
var logger = require('./logger.js');

// Load Grove module
var groveSensor = require('jsupm_grove');

// Load the database models
var Data = require('intel-commerical-edge-network-database-models').DataModel;

// Print the server status
logger.info("Edge Device Daemon is starting");

// Connect to the MQTT server
var mqttClient  = mqtt.connect(config.mqtt.url);

// MQTT connection function
mqttClient.on('connect', function () {
    mqttClient.publish("announcements", JSON.stringify({"announcement" : "light"}));
    logger.info("Connected to MQTT server");
});

// Create the temperature sensor object using AIO pin 0
var temp = new groveSensor.GroveTemp(0);
var groveRotary = new groveSensor.GroveRotary(3);

var temperatureLoop = function() {

    var data = temp.value();
    var numericValue = +data;
    var rel = groveRotary.rel_value() * 0.05;
    var firstPassData = numericValue + rel;
    var newdata = firstPassData.toFixed(0);

    logger.info("temperature = " + newdata);
    
    // Build JSON structure to hold
    // data on the edge network
    var sensorData = new Data({
        sensor_id: "temperature",
        value: newdata
    });

    mqttClient.publish (
        "sensors/temperature/data",
        JSON.stringify({
		sensor_id: sensorData.sensor_id,
		value: sensorData.value,
		timestamp: Date.now()
	})
    );
};

// Call the temperature loop function
setInterval( temperatureLoop, 1000 );
