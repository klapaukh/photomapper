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


function delTag(elem){
  console.log("Delete: " + elem);
}

function clickTag(elem){
  console.log("Filter: " + elem);
}

function addTag(elem){
 var form = elem.parentElement;
 var photoName = form.querySelector('[name="photo"]').value;
 var tag = form.querySelector('[name="tag"]').value;

 console.log(tag); 

 if(tag === undefined || !(/\S/.test(tag))){
   console.log("Tag must not be empty");
   return;
 }
 
 $.get("/addTag?photo="+
       encodeURIComponent(photoName) +
       "&tag=" +
       encodeURIComponent(tag), function(result){
   if(result === "true"){
     console.log("Photo tags updated");
   } else {
     console.log("Photo tag update failed");
   }
 });
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


    var tagString = 'Tags: ';
    var tags = ['None'];
    if(photo.tags){
       tags = photo.tags.split(/,\s*/);
       allTags = allTags.concat(tags);
       tags.forEach(function (tag, index){
         tagString= tagString.concat((index == 0 ? " ":", "),
            '<span class="tag-group">',
            '<span class="tag-name text-info" onclick="clickTag(this)">',
            tag, 
            '</span>',
            '<span class="text-danger glyphicon glyphicon-remove del-icon" onClick="delTag(this)"></span>',
            '</span>');
       });
    }

    var m = L.marker([photo.lat,photo.lon],{icon: myIcon, tags: tags});

    m.bindPopup("<a href=\"" +
        photo.filename +
        "\" target=\"newtab\" > <img src=\"" + 
        photo.filename + 
        "\" width=\"100px\" /> </a><br />" +
        tagString + 
        " <form>" + 
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

  L.control.tagFilterButton({
    data: allTags
  }).addTo(mymap);

  var filters = $('ul#tag-list')
  $.each(allTags, function(i)
  {
    var li = $('<li/>')
        .appendTo(filters);
    var inputBox = $('<input type="checkbox"/>')
        .addClass('tag-checkbox')
        .appendTo(li);
    var text = $('<span />')
         .text(allTags[i])
         .appendTo(li);
  });
});

