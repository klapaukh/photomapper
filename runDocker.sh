#! /bin/bash

echo "$@"

if [ "$#" -ne "2" ]
then
  echo "Must provide two arguments. First the geotagged folder, second the manually tagged folder"
 exit 1
fi

if [ ! -d "$1" ]
then
  echo "geotagged folder, $1, not actually a directory"
  exit 1
fi 

if [ ! -d "$2" ]
then
  echo "manually tagged folder, $2, not actually a directory"
  exit 1
fi 


docker run -v "$1":/opt/geotagged -v "$2":/opt/manuallyTagged
