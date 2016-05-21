"use strict";

// We are using a leaflet map centered on Wellington
var mymap = L.map('mapid').setView([-41.296, 174.777], 5);

// Global variable to store all the markers. This way we can easily search
// through and modify them. 
var markers = [];

// Global store of all used tags
var allTags = [];

// Global link to the pruneCluster to tell it to update
var pruneCluster = new PruneClusterForLeaflet();

// We are using the free OSM tiles 
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);


/*
 * Delete a tag from the current photo. Must update the popup box, as well as 
 * send a request to delete the data from the photo. Confirm with a popup.
 */
function delTag(elem){
  console.log("Delete: " + elem);
}

/*
 * Check the checkbox for the clicked filter
 */
function clickTag(elem){
  console.log("Filter: " + elem);
}

/*
 * Add a tag to a photo. This both updates the photo's popup and 
 * sends a request to update the data in the photo. Shows an error
 * if the write to a photo fails.
 */
function addTag(elem){
 //Get the data for what to update       
 var form = elem.parentElement;
 var photoName = form.querySelector('[name="photo"]').value;
 var tag = form.querySelector('[name="tag"]').value;

 console.log("Adding tag:" + tag); 

 if(tag === undefined || !(/\S/.test(tag))){
   console.log("Tag must not be empty");
   return;
 }

 //Send a request to update the photo EXIF data 
 $.get("/addTag?photo="+
       encodeURIComponent(photoName) +
       "&tag=" +
       encodeURIComponent(tag), function(result){
   if(result === "true"){
     console.log("Photo tags updated");

     //Update the markers popup box in the persistent store
     var im = pruneCluster.
       GetMarkers().
       findIndex(function(m) { return m.data.photo === photoName; });
     if(im === undefined){
       console.error("Couldn't find the photo popup to update");
     }

     var m = pruneCluster.GetMarkers()[im];

     m.data.tags.push(tag);
     var newPopup =  toMarkerPopupString(m);

     m.data.popup = newPopup;

     //Update the leaflet marker popup binding
     pruneCluster._objectsOnMap[im].data._leafletMarker.bindPopup(newPopup,undefined)
     
     //update the actual popup on the screen.
     var tagList = $('.tags-list')
     var tagGroup = $('<span/>')
        .addClass('tag-group')
        .appendTo(tagList);
     var tagName = $('<span onClick="clickTag(this)"/>')
        .addClass('tag-name')
        .text((m.data.tags.length === 1 ? " " : ", ") + tag)
        .appendTo(tagGroup);
     var text = $('<span />')
         .addClass('text-danger')
         .addClass('glyphicon-remove')
         .addClass('glyphicon')
         .addClass('del-icon')
         .appendTo(tagGroup);

     if(allTags.findIndex(function(t){ return  t === tag; }) !== undefined) {
       allTags.push(tag);
       addFilterBoxes([tag]);
     }

     pruneCluster.ProcessView();
   } else {
     console.error(result);
     console.error("Photo tag update failed");
   }
 });
}


/* 
 * Generate a string to represent the list of tags. Each tag is 
 * clickable, and has a delete button next to it. The list also 
 * starts with the word Tags:
 */
function toTagString(allTags){
  var tagString = 'Tags: ';

  if(allTags === undefined){
    return tagStrings;
  } 

  allTags.forEach(function (tag, index){
    tagString= tagString.concat((index == 0 ? " ":", "),
       '<span class="tag-group">',
       '<span class="tag-name text-info" onclick="clickTag(this)">',
       tag, 
       '</span>',
       '<span class="text-danger glyphicon glyphicon-remove del-icon" onClick="delTag(this)"></span>',
       '</span>');
       });

  return tagString;
}

/*
 * Generate the popup text for each marker.
 * This should have a small thumbnail of the photo which is 
 * a link to a bigger version. It should also list all the tags 
 * which are clickable, and allow you to add and remove tags. 
 */
function toMarkerPopupString(marker){
  return "<a href=\"" +
        marker.data.photo +
        "\" target=\"newtab\" > <img src=\"" + 
        marker.data.photo + 
        "\" width=\"100px\" /> </a><br />" +
        '<span class="tags-list">' +
        toTagString(marker.data.tags) +
       '</span>' +  
        " <form>" + 
        "<input type=\"hidden\" value=\"" +
        marker.data.photo + 
        "\" + name=\"photo\" />" + 
        "<input type=\"text\" size=\"6\" name=\"tag\" />" + 
        "<button type=\"button\" onclick=\"addTag(this)\">Add</button>" +
        "</form>";
}


/*
 * Add checkboxes for each of the tags
 */
function addFilterBoxes(tags){
  var filtersList = $('ul#tag-list');
  tags.forEach(function(t) {
    var li = $('<li/>')
        .appendTo(filtersList);
    var inputBox = $('<input type="checkbox"/>')
        .addClass('tag-checkbox')
        .appendTo(li);
    var text = $('<span />')
         .text(t)
         .appendTo(li);
  });
}

// All of the data comes from the servers photos endpoint
$.get("/photos",function(result) { 


  //Turn each photo into a marker with a popup and attached information.
  //All markers are stored in the global markers variable. 
  result.forEach(function(photo){
    //If it aint a photo with GPS coordinates, skip it.
    if(photo.lat === '' || photo.lon === '' || 
       photo.lat === undefined || photo.lon === undefined ){
      console.log("Missing lat/lon data in image " + photo.filename);
      return;
    }

    //Get the tags
    var tags = photo.tags;
    if(tags){
       tags = photo.tags.split(/,\s*/);
    } else {
      tags = [];
    }

    // Keep the list of all tags
    allTags = allTags.concat(tags);

    var marker = new PruneCluster.Marker(photo.lat, photo.lon);

    marker.data.tags = tags;
    marker.data.photo = photo.filename;
    
    marker.data.popup = toMarkerPopupString(marker);
  
    pruneCluster.RegisterMarker(marker);

    markers.push(marker);
  });

  allTags = $.unique(allTags).sort(); 

  mymap.addLayer(pruneCluster);

  addFilterBoxes(allTags);
});

