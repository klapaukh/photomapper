/*
 *  Photo Mapper for viewing, tagging, and filtering photos on a map 
 *  Copyright (C) 2016  Roman Klapaukh
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

// We are using a leaflet map centered on Wellington
var mymap = L.map('mapid').setView([-41.296, 174.777], 5);

// Global store of all used tags
var allTags = [];

// Is this if the first filter people applied
var filters = [];

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
 //Get the data for what to update       
 var form = $(elem).closest(".tags-list").siblings("form")[0];
 var photoName = form.querySelector('[name="photo"]').value;
 var tag = $(elem).siblings(".tag-name").text();

 console.log("Removing tag:" + tag); 

 if(tag === undefined || !(/\S/.test(tag))){
   console.log("Tag must not be empty");
   return;
 }

 //Send a request to update the photo EXIF data 
 $.get("/delTag?photo="+
       encodeURIComponent(photoName) +
       "&tag=" +
       encodeURIComponent(tag), function(result){
   if(result === "true"){
     console.log("Photo tags updated");

     //Update the markers popup box in the persistent store
     var m = pruneCluster.
       GetMarkers().
       find(function(m) { return m.data.photo === photoName; });

     if(m === undefined){
       console.error("Couldn't find the photo popup to update");
     }

     m.data.tags = m.data.tags.filter( function(t) {return t !== tag; });
     var newPopup =  toMarkerPopupString(m);

     m.data.popup = newPopup;

     //Update the leaflet marker popup binding
     var leafm = pruneCluster
         ._objectsOnMap
         .find(function(m) { return m.lastMarker.data.photo === photoName; });

     if(leafm !== undefined){  
       leafm.data._leafletMarker.bindPopup(newPopup,undefined);
     }
     
     // If this is the first in the list, remove the next comma
     var nPrev = $(elem).parent().prev('.tag-group').size();
     var next  = $(elem).parent().next('.tag-group');

     if(nPrev === 0 && next.size() > 0){
       // remove now leading comma
       next.children(".space").text(" ");
     }

     //update the actual popup on the screen.
     $(elem).parent().remove(); 

     pruneCluster.ProcessView();
   } else {
     console.error(result);
     console.error("Photo tag update failed");
   }
 });

}

/*
 * Check the checkbox for the clicked filter and apply the filter
 */
function clickTag(tag){
  var tagList = $('#tag-list li');
  tagList.each(function(i){
    var elem = tagList[i];
    var span = $(elem).find('span');
    var t = $(span).text();
    if(t === tag){
      var input = $(elem).find('input');
      if(!input.prop('checked')){
        input.prop('checked',true);
        filters.push(tag);
      }

    }
  });

  filterTag(tag);
}

function filterTag(tag){
  pruneCluster.
    GetMarkers().
    forEach(function(m){
      var matches = m.data.tags.find(function(t) { return t === tag; });
      if(matches !== undefined){
        m.filtered = false;
      } else if(filters.length === 1) {
        //If it's the first filter than everything else needs to hide
        m.filtered = true;
      }
    });

  pruneCluster.ProcessView();
}

function unFilterTag(tag){
  pruneCluster.
    GetMarkers().
    forEach(function(m){
      if(m.filtered === false){
        var matches = m.data.tags.
          find(function(t) { 
            return filters.find(function(f){
              return t === f;
            }) !== undefined 
          });
        if(matches === undefined){
          m.filtered = true;
        } 
      }
    });

  pruneCluster.ProcessView();
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
 form.querySelector('[name="tag"]').value = "";

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
     var m = pruneCluster.
       GetMarkers().
       find(function(m) { return m.data.photo === photoName; });
     if(m === undefined){
       console.error("Couldn't find the photo popup to update");
     }

     m.data.tags.push(tag);
     var newPopup =  toMarkerPopupString(m);

     m.data.popup = newPopup;

     //Update the leaflet marker popup binding
     var leafm = pruneCluster
         ._objectsOnMap
         .find(function(m) { return m.lastMarker.data.photo === photoName; });
       
     if(leafm !== undefined){
       leafm.data._leafletMarker.bindPopup(newPopup,undefined);
     }
     
     //update the actual popup on the screen.
     var tagList = $('.tags-list')
     var tagGroup = $('<span/>')
        .addClass('tag-group')
        .appendTo(tagList);
     var space = $('<span />')
        .addClass('space')
        .text((m.data.tags.length === 1 ? " " : ", "))
        .appendTo(tagGroup);
     var tagName = $('<span onClick="clickTag($(this).text())"/>')
        .addClass('tag-name')
        .addClass('text-info')
        .text(tag)
        .appendTo(tagGroup);
     var text = $('<span onClick="delTag(this)" />')
         .addClass('text-danger')
         .addClass('glyphicon-remove')
         .addClass('glyphicon')
         .addClass('del-icon')
         .appendTo(tagGroup);

     if(allTags.find(function(t){ return  t === tag; }) === undefined) {
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
    tagString = tagString.concat('<span class="tag-group">',
       '<span class="space">',
       (index == 0 ? " ":", "),
       '</span>',
       '<span class="tag-name text-info" onclick="clickTag($(this).text())">',
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
        '<input type="text" size="6" name="tag" onkeydown = "if (event.keyCode == 13) { addTag(this); return false; } " />' + 
        "<button type=\"button\" onclick=\"addTag(this)\">Add</button>" +
        "</form>";
}


/*
 * Add checkboxes for each of the tags
 */
function addFilterBoxes(tags){
  var filtersList = $('ul#tag-list');
  tags.forEach(function(t) {
    if(t === undefined || t === '') {
       return;
    }
    var li = $('<li/>')
        .appendTo(filtersList);
    var inputBox = $('<input type="checkbox"/>')
        .addClass('tag-checkbox')
        .click(function() {
          var checked = $(this).prop('checked');
          var li = $(this).parent();
          var span = $(li).find('span');
          var t = $(span).text();
          if(checked){
            filters.push(t);
            filterTag(t);
          } else {
            filters = filters
              .filter(function(x) { return x !== t; });
            if(filters.length === 0){
              resetFilters();
            } else { 
              unFilterTag(t);
            }
          }
        })
        .appendTo(li);
    var text = $('<span />')
         .text(t)
         .appendTo(li);
  });
}

/*
 * Reset all the filters.
 * Makes all the markers visible, and makes all the 
 * checkboxes unchecked. 
 */
function resetFilters(){
  pruneCluster.GetMarkers().forEach(function(m){
    m.filtered = false;
  });
  pruneCluster.ProcessView();

  var boxes = $('.tag-checkbox');
  boxes.each(function(i){
    boxes[i].checked = false;
  });
  
  filters = [];
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
    if(typeof(tags) === "object"){
      //When there is exactly one it thinks it's a list for some reason
    } else if(tags){
       tags = tags.split(/,\s*/);
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

  });

  //Remove duplicates and sort
  allTags = allTags.filter(function onlyUnique(value, index, self) { 
       return self.indexOf(value) === index;
    }).sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase()); 
    });

  mymap.addLayer(pruneCluster);

  addFilterBoxes(allTags);
});

