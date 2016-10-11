#!/bin/bash
        rm latlong.txt
        for i in $( ls ../Centroids ); do 
        	COORDINATE=`ogrinfo ../Centroids/$i $i |grep 'POINT'`
            echo $i, $COORDINATE >> latlong.txt
            
        done
        
        
    