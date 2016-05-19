## Photo Mapper

This tool will place photos provided to it onto a map so they can be easily
explored. Photos should be searchable by tags, taggable. Photos should have
popups that come up with the relevant tags and photos. 

#### Photo Storage

The application should support both geotagged and manually located photos.
There are two directories where photos should be stored:
   * `public/images/geotagged` for geotagged images. Photos can be placed in
     folders arbitrarily.
   * `public/images/manuallyPlaced` which contains directories with coordinates.
     Each directory should be labelled in the format `lat_lon` and contain
     photos at that location. 

#### Progress
Implemented:
   * Map is displayed
   * Show markers for photos with manually added locations
   * Show markers for photos with embedded geotags
   * Show photo in popup
   * Make popup photo expand to a full size version (opens in a new tab)

Partial:
   * Make tags appear in popup
   * Make tags searchable
   * Allow tags to be added 
   * Basic Docker script

To do:
   * Tag deletion
   * Tags being updated in the markers as well as the files


