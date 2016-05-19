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

function addTag(elem){
 var form = elem.parentElement;
 var photoName = form.querySelector('[name="photo"]').value;
 var tag = form.querySelector('[name="tag"]').value;
 console.log(photoName + " " + tag);
}

var myIcon = new MyIcon();

// All of the data comes from the servers photos endpoint
$.get("/photos",function(result) { 
  var markers = L.markerClusterGroup(/**{
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true   
  }*/);

  var allTags = [];

  result.forEach(function(photo){
    if(photo.lat === '' || photo.lon === '' || 
       photo.lat === undefined || photo.lon === undefined ){
      console.log("Missing lat/lon data in image " + photo.filename);
      return;
    }

    var m = L.marker([photo.lat,photo.lon],{icon: myIcon});

    var tagString = "Tags: ";
    if(photo.tags){
       photo.tags.forEach(function (tag){
         tagString= tagString.concat(" ", tag);
         allTags.push(tag);
       });
    }


    m.bindPopup("<a href=\"" +
        photo.filename +
        "\" target=\"newtab\" > <img src=\"" + 
        photo.filename + 
        "\" width=\"100px\" /> </a><br />" +
        tagString + 
        " <form id=\"tagForm\">" + 
        "<input type=\"hidden\" value=\"" +
        photo.filename + 
        "\" + name=\"photo\" />" + 
        "<input type=\"text\" size=\"6\" name=\"tag\" />" + 
        "<button type=\"button\" onclick=\"addTag(this)\">Add</button>" +
        "</form>" 
        );
    
    markers.addLayer(m);

  });

  allTags = $.unique(allTags); 

  mymap.addLayer(markers);

})


