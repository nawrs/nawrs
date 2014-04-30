// core.js
// By: Karl Benedict
// Updated: 2013-07-19
// NAWRS mapper version 2 javascript

// Initialize Google Visualization API Component(s)
google.load('visualization', '1', {packages: ['table']})

// define global variables
var reservationBBOX = []
var stateBBOX = []
var hucBBOX = [] 
var map
var westernUS = new google.maps.LatLng(41,-107)
var contiguousUS = new google.maps.LatLng(39.8333,-98.5833)
var allUS = new google.maps.LatLng(45,-103.75)



// Return the minimum and maximum values of an array
function arrayMinMax(myArray) {
	var min = 9999999999
	var max = -9999999999
	for (var i=0; i<myArray.length; i++) {
		if (myArray[i] < min) {min = myArray[i];}
		if (myArray[i] > max) {max = myArray[i];}
	}
	return [min,max]
}


// zoomToReservation function: zooms to the bounding box associated with a specific reservation based upon its name
function zoomToReservation(myReservation, myMap) {
	//alert("zooming to " + myReservation  );
	$("div#docsReservationsPopUp").slideToggle();
	myReservation = unescape(myReservation);
	var combinedBBOX = []
	var lat = []
	var lon = []
	var output = []
	for (var i=0;i<reservationBBOX.length;i++) {
		//alert(reservationBBOX[i][0]);
		if (reservationBBOX[i][0] == myReservation) {
			//output.push(reservationBBOX[i][0],reservationBBOX[i][1],reservationBBOX[i][2],reservationBBOX[i][3])
			// extract lat and lon values from each matching BBOX to calculate a combined BBOX
			for (var j=0;j<reservationBBOX[i][1].length;j++) {
				lat.push(reservationBBOX[i][1][j][1]);
				//alert("lat: "+lat);
				lon.push(reservationBBOX[i][1][j][0]);
				//alert("lon: "+lon);
			};
		};
	};
	//alert("lat: "+lat);
	//alert("lon: "+lon);
	latMinMax = arrayMinMax(lat)
	lonMinMax = arrayMinMax(lon)
	var minLat = latMinMax[0]
	var maxLat = latMinMax[1]
	var minLon = lonMinMax[0]
	var maxLon = lonMinMax[1]
	//alert("minLat: "+minLat+"\nmaxLat: "+maxLat + "\nminLon: "+minLon + "\nmaxLon: "+maxLon)
	
	map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(minLat,minLon), new google.maps.LatLng(maxLat,maxLon)))
	
	retrieveDocsByGeometry("Name",myReservation)
};

// zoomToState function: zooms to the bounding box associated with a specific state based upon its name
function zoomToState(myState,map) {
	//alert("zooming to " + myState  );
	$("div#docsStatesPopUp").slideToggle();
	var combinedBBOX = []
	var lat = []
	var lon = []
	var output = []
	for (var i=0;i<stateBBOX.length;i++) {
		//alert(reservationBBOX[i][0]);
		if (stateBBOX[i][0] == myState) {
			// extract lat and lon values from each matching BBOX to calculate a combined BBOX
			for (var j=0;j<stateBBOX[i][1].length;j++) {
				lat.push(stateBBOX[i][1][j][1]);
				//alert("lat: "+lat);
				lon.push(stateBBOX[i][1][j][0]);
				//alert("lon: "+lon);
			};
		};
	};
	//alert("lat: "+lat);
	//alert("lon: "+lon);
	latMinMax = arrayMinMax(lat)
	lonMinMax = arrayMinMax(lon)
	var minLat = latMinMax[0]
	var maxLat = latMinMax[1]
	var minLon = lonMinMax[0]
	var maxLon = lonMinMax[1]
	//alert("minLat: "+minLat+"\nmaxLat: "+maxLat + "\nminLon: "+minLon + "\nmaxLon: "+maxLon)
	
	map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(minLat,minLon), new google.maps.LatLng(maxLat,maxLon)))

	retrieveDocsByGeometry("STATE",myState)

};

// zoomToHuc function: zooms to the bounding box associated with a specific huc based upon its name
function zoomToHuc(myHuc) {
	$("div#docsHucsPopUp").slideToggle();
	var combinedBBOX = []
	var lat = []
	var lon = []
	var output = []
	for (var i=0;i<hucBBOX.length;i++) {
		if (hucBBOX[i][0] == myHuc) {
			// extract lat and lon values from each matching BBOX to calculate a combined BBOX
			for (var j=0;j<hucBBOX[i][1].length;j++) {
				lat.push(hucBBOX[i][1][j][1]);
				//alert("lat: "+lat);
				lon.push(hucBBOX[i][1][j][0]);
				//alert("lon: "+lon);
			};
		};
	};
	//alert("lat: "+lat);
	//alert("lon: "+lon);
	latMinMax = arrayMinMax(lat)
	lonMinMax = arrayMinMax(lon)
	var minLat = latMinMax[0]
	var maxLat = latMinMax[1]
	var minLon = lonMinMax[0]
	var maxLon = lonMinMax[1]
	//alert("minLat: "+minLat+"\nmaxLat: "+maxLat + "\nminLon: "+minLon + "\nmaxLon: "+maxLon)
	
	map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(minLat,minLon), new google.maps.LatLng(maxLat,maxLon)))

	retrieveDocsByGeometry("REG_NAME",myHuc)

};

// retrieve the documents, links and types for a specified geography
function retrieveDocsByGeometry(geoField,geoName) {
	// !!! need to figure out how to escape names with embedded quotes in the query - think I fixed this with a combination of escaping
	var docList = []
	var query = "SELECT Name,DocTitle,DocLink,DocType FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocTitle > 0 AND " + geoField + " = " + "\'" + unescape(geoName).replace("'","''") + "\' GROUP by Name,DocTitle,DocLink,DocType" ;
	//alert(query)
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		//alert(data[1])
		var rows = data['rows'];
		for (var i in rows) {
		  var myItems = {
		  	"reservation": rows[i][0],
		  	"name": rows[i][1],
		  	"link": "<a target='_blank' href=\"" + rows[i][2] + "\">" + rows[i][2] + "</a>",
		  	"type": rows[i][3]
		  };
		  docList.push(myItems);
		  //alert(myItems)
		}
		//alert(docList + i);
		//if ($("div#docList").css("display") == "none") {$("div#docListHandle").slideToggle()};
		docListUpdate(docList);
	  }
	});
}

// retrieve the documents, links and types for a specified document type
function retrieveDocsByType(myType) {
	// !!! need to figure out how to escape names with embedded quotes in the query
	$("div#docsTypePopUp").slideToggle();
	var docList = []
	var query = "SELECT Name,DocTitle,DocLink,DocType FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocType = \'"  + myType + "\' GROUP by Name,DocTitle,DocLink,DocType" ;
	//alert(query)
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		//alert(data[1])
		var rows = data['rows'];
		for (var i in rows) {
		  var myItems = {
		  	"reservation": rows[i][0],
		  	"name": rows[i][1],
		  	"link": "<a target='_blank' href=\"" + rows[i][2] + "\">" + rows[i][2] + "</a>",
		  	"type": rows[i][3]
		  };
		  docList.push(myItems);
		  //alert(myItems)
		}
		//alert(docList + i);
		//if ($("div#docList").css("display") == "none") {$("div#docListHandle").slideToggle()};
		docListUpdate(docList);
	  }
	});
	map.panTo(allUS)
	map.setZoom(3)
}



// update the document listing content with the current docList array content
function docListUpdate(data) {
	// do some CSS display stuff to resolve an issue with table layout problems if the div's visibility is set to none
	if ($('div#docList').css("display") == "none") {
		$("div#docListHandle").css("display","block");
		$("div#docList").slideToggle(); 
		$("div#docListHandle").animate({bottom:"300px"})
	} ;
	
	// define the data table content
	$('#docListTable').dataTable( {
		"bDestroy": true,
		"bPaginate": false,
		"sScrollY": "220px",
		"sDom": 'T<"clear">lfrtip',
		"oTableTools": {
            "sSwfPath": "http://kkb-projects.s3.amazonaws.com/nawrs/js/DataTables-1.9.4/extras/TableTools/media/swf/copy_csv_xls_pdf.swf",
			"aButtons": [
				"copy",
				"csv",
				"xls",
				{
					"sExtends": "pdf",
					"sPdfOrientation": "landscape",
					"sPdfMessage": "NAWRS Mapping Application Document List"
				}
			]
        },
		"aaData": data,
		"aoColumns": [
			{ "sTitle": "Reservation/Tribe", "mData":"reservation" },
			{ "sTitle": "Document Type", "mData":"type" },
			{ "sTitle": "Document Name", "mData":"name" },
			{ "sTitle": "Document Link", "mData":"link" }
		]
	} );
	
}

// Execute Once Page is Finished Loading 
function initialize() {

	// event capture
	// toggle the display of the document reservations list when the label div is clicked
	$("div#docsReservations").click( function () {
		$("div#docsReservationsPopUp").slideToggle();
		}
	);
	// toggle the display of the document states list when the label div is clicked
	$("div#docsStates").click( function () {
		$("div#docsStatesPopUp").slideToggle();
		}
	);
	// toggle the display of the document hucs list when the label div is clicked
	$("div#docsHucs").click( function () {
		$("div#docsHucsPopUp").slideToggle();
		}
	);
	// toggle the display of the document types list when the label div is clicked
	$("div#docsType").click( function () {
		$("div#docsTypePopUp").slideToggle();
		}
	);
	// toggle the display of the document list when the handle div is clicked
	$("div#docListHandle").click( function () {
		displayState = $("div#docList").css("display")
		if (displayState == "none") {$("div#docListHandle").animate({bottom:"300px"})}
		else if (displayState == "block") {$("div#docListHandle").animate({bottom:"0px"})}
		$("div#docList").slideToggle();
		}
	);

	// retrieve the list of all state bounding boxes for use in zooming
	var query = "SELECT STATE,geometry FROM 1ahQjZkkpdGqA3i7sEySiU4C35LXE_A_-fcuCGAk ";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		for (var i in rows) {
		  var myItems = [];
		  myItems.push(rows[i][0]);
		  myItems.push(rows[i][1].geometry.coordinates[0]);
		  stateBBOX.push(myItems);
		}
	  }
	});

	// retrieve the list of all huc bounding boxes for use in zooming
	var query = "SELECT REG_NAME,geometry FROM 1eE3z2p_OH9cs962hjockBtMERZFmztV4oAYQLBo";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		for (var i in rows) {
		  var myItems = [];
		  myItems.push(rows[i][0]);
		  myItems.push(rows[i][1].geometry.coordinates[0]);
		  hucBBOX.push(myItems);
		}
	  }
	});




	// retrieve the list of all states with documents from the fusion table and add them to the docsStatesPopup popup list
	var query = "SELECT STATE FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocTitle > 0 group by STATE";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		var docsStatesPopupDiv = document.getElementById('docsStatesPopUp');
		var $docsStatesList = $( "#docsStatesList" );
		var myItems = [];
		for (var i in rows) {
		  var stateName = rows[i][0];
		  myItems.push( '<li onclick="zoomToState(\'' + stateName + '\',map);">' + stateName + "</li>" );
		}
		//alert(myItems.join( "" ) );
		$docsStatesList.append( myItems.join( "" ) );
	  }
	});

	// retrieve the list of all hucs with documents from the fusion table and add them to the docsHucsPopUp popup list
	var query = "SELECT REG_NAME FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocTitle > 0 group by REG_NAME";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		var docsHucsPopupDiv = document.getElementById('docsHucsPopUp');
		var $docsHucsList = $( "#docsHucsList" );
		var myItems = [];
		for (var i in rows) {
		  var hucName = rows[i][0];
		  myItems.push( '<li onclick="zoomToHuc(\'' + hucName + '\');">' + hucName + "</li>" );
		}
		//alert(myItems.join( "" ) );
		$docsHucsList.append( myItems.join( "" ) );
	  }
	});



	// retrieve the list of all reservations with documents from the fusion table and add them to the allReservations popup list
	var query = "SELECT Name FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocTitle > 0 GROUP BY Name";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		var docsReservationsPopupDiv = document.getElementById('docsReservationsPopup');
		var $docsReservationsList = $( "#docsReservationsList" );
		var myItems = [];
		for (var i in rows) {
		  var reservationName = escape(rows[i][0]);
		  myItems.push("<li onclick=\"zoomToReservation(\'" + reservationName + "\',map);\">" + unescape(reservationName) + "</li>" );
		}
		//alert(myItems.join( "" ) );
		$docsReservationsList.append( myItems.join( "" ) );
	  }
	});


	// retrieve the list of all document types from the fusion table and add them to the docTypePopUp  list
	var query = "SELECT DocType FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocType > 0 GROUP BY DocType";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		var docsTypePopupDiv = document.getElementById('docsTypePopUp');
		var $docsTypeList = $( "#docsTypeList" );
		var myItems = [];
		for (var i in rows) {
		  var typeName = rows[i][0];
		  myItems.push( '<li onclick="retrieveDocsByType(\'' + typeName.trim() + '\')">' + typeName.trim() + "</li>" );
		}
		//alert(myItems.join( "" ) );
		$docsTypeList.append( myItems.join( "" ) );
	  }
	});



	// retrieve the list of all reservation bounding boxes and document info for use in zooming and display of list
	var query = "SELECT Name,geometry_bbox,DocTitle,DocLink FROM 1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg WHERE DocTitle > 0 GROUP BY Name,geometry_bbox,DocTitle,DocLink";
	var encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v1/query'];
    url.push('?sql=' + encodedQuery);
    url.push('&hdrs=false');
    url.push('&key=AIzaSyB34bTeAUs8u2NphA-81mJdGTokE3AodH8');
    //alert( url.join("") );
	$.ajax({
	  url: url.join(''),
	  dataType: 'jsonp',
	  success: function (data) {
		var rows = data['rows'];
		for (var i in rows) {
		  var myItems = [];
		  myItems.push(rows[i][0]);
		  myItems.push(rows[i][1].geometry.coordinates[0]);
		  //myItems.push(rows[i][2]);
		  //myItems.push(rows[i][3]);
		  reservationBBOX.push(myItems);
		}
	  }
	});
	


	// Map initialization ================================================================
	var myOptions = {
	  zoom: 3,
	  center: allUS,
	  mapTypeId: google.maps.MapTypeId.TERRAIN,
	  mapTypeControl: false,
	  panControl: false,
	  rotateControl: false,
	  streetViewControl: false
	};
	// create map object
	map = new google.maps.Map(document.getElementById("map_canvas"),
		myOptions);

  	var HUCbounds = new google.maps.KmlLayer({
 		url: "http://nawrs.net/huc2_geomedupl_s11.kml",
 		preserveViewport: true,
 		clickable: false
		})
 	HUCbounds.setMap(map)

	
 	
 	var BIAbounds = new google.maps.KmlLayer({
 		url: "http://nawrs.net/BIA_004.kml",
 		preserveViewport: true
		})
 	BIAbounds.setMap(map)

 
	// crete a map layer that depicts only those tribal lands that have documents associated with them
	var BIAdocs = new google.maps.FusionTablesLayer({
		query: {
			select: 'geometry',
			from: '1v2IlIFJqat2tTSBA8e4guqlzMGRe8iW4yXP25Kg',
			where: 'DocTitle > 0'
		},
		styles: [
		{
			polygonOptions: {
				fillColor: "#009900",
				fillOpacity: 0.0,
				strokeWeight: 0.0
			}
		}],
		clickable: false
	});
	BIAdocs.setMap(map)



}