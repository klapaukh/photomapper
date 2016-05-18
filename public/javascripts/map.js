"use strict";

// We are using a leaflet map centered on Wellington
var mymap = L.map('mapid').setView([-41.296, 174.777], 5);

// We are using the free OSM tiles 
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);


//Extend the Default marker class
var MyIcon = L.Icon.Default.extend({
   options: {
   	    iconUrl: '/images/marker-icon.png',
        iconRetinaUrl: '/images/marker-icon-2x.png',
        shadowUrl: '/images/marker-shadow.png',
        shadowRetinaUrl: '/images/marker-shadow.png'
   }
});

var myIcon = new MyIcon();

// All of the data comes from the servers photos endpoint
$.get("/photos",function(result) { 
  var markers = L.markerClusterGroup(/**{
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true   
  }*/);

  result.forEach(function(photo){
    var m = L.marker([photo.lat,photo.lon],{icon: myIcon});
    
    m.bindPopup("<img src=\"" + photo.filename + "\" width=\"100px\" />");
    
    markers.addLayer(m);

  });
  mymap.addLayer(markers);
})
