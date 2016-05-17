"use strict";

// We are using a leaflet map centered on Wellington
var mymap = L.map('mapid').setView([-41.296, 174.777], 5);

// We are using the free OSM tiles 
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

var markers = L.markerClusterGroup();

// All of the data comes from the servers photos endpoint
$.get("/photos",function(result) { 
  console.log(result);

  var markers = L.markerClusterGroup();

  result.forEach(function(photo){
    L.marker([photo.lat,photo.lon]).addTo(mymap);
  });
})
