"use strict";

// We are using a leaflet map centered on Wellington
var mymap = L.map('mapid').setView([-41.296, 174.777], 5);

// We are using the free OSM tiles 
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

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


// All of the data comes from the servers photos endpoint
$.get("/photos",function(result) { 

  var allTags = [];
  var pruneCluster = new PruneClusterForLeaflet();

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

    var marker = new PruneCluster.Marker(photo.lat, photo.lon);

    marker.data.tags = tags;
    
    marker.data.popup = "<a href=\"" +
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
        "</form>";
    
    pruneCluster.RegisterMarker(marker);
  });

  allTags = $.unique(allTags); 

  mymap.addLayer(pruneCluster);

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

