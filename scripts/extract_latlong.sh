#!/bin/bash
        rm latlong.txt
        for i in $( ls ../JSON/Centroids ); do 
        	COORDINATE=`ogrinfo -al ../JSON/Centroids/$i |grep 'POINT'`
            echo $i, $COORDINATE >> latlong.txt
            
        done
        
        
    