 var style = new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'transparent'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          width: 1
        }),
        text: new ol.style.Text({
          font: '12px Calibri,sans-serif',
          fill: new ol.style.Fill({
            color: '#000'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3
          })
        })
      });  
	  


// Basemaps

/* var Layer_Stamen_watercolor = new ol.layer.Group({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.Stamen({layer: 'watercolor'})
        })
    ]
});  */

var Layer_Stamen_terrain = new ol.layer.Group({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.Stamen({layer: 'terrain'})
        })
    ]
});

var Layer_OSM = new ol.layer.Group({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ]
});

var Layer_USGSTopo = (new ol.layer.Tile({
  source: new ol.source.TileWMS({
	url: 'https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WmsServer?',
	  params: {
		LAYERS: 0,
		FORMAT: 'image/png',
		TRANSPARENT: true
	  },
	  attributions: [
	    new ol.Attribution({
		  html: 'Data provided by the <a href="http://basemap.nationalmap.gov">National Map</a>.'
		})
	  ]
  }),
  opacity: 0.85
}));

// Reference Layers

var Layer_States = new ol.layer.Vector({
        source: new ol.source.Vector({
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/cb_2015_us_state_500k.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/us_state_BS_1hundthDD.geojson',
		  url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/us_state_BS_5hundthDD.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/us_state_PR_1hundthDD.geojson',
          format: new ol.format.GeoJSON(),
        }),
		//opacity: 0.1,
		  style: new ol.style.Style({
            fill: new ol.style.Fill({
              color: 'transparent'
			}),
			stroke: new ol.style.Stroke({
			color: '#673AB7',
			width: 1
			}),
			text: new ol.style.Text({
			font: '12px Calibri,sans-serif',
			fill: new ol.style.Fill({
				color: '#000'
			}),
			stroke: new ol.style.Stroke({
				color: '#fff',
				width:3
			})
			})
		})
        /*style: function(feature, resolution) {
          style.getText().setText(resolution < 5000 ? feature.get('name') : '');
          return style;
        }  */
      });
	  Layer_States.setVisible(false);

var Layer_Watersheds = new ol.layer.Vector({
        source: new ol.source.Vector({
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/wbdhu2_BS_1hundthDD.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/wbdhu2_BS_5hundthDD.geojson',
		 url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/wbdhu2_PR_1hundthDD.geojson',
         format: new ol.format.GeoJSON(),
        }),
		style: new ol.style.Style({
            fill: new ol.style.Fill({
              color: 'transparent'
			}),
			stroke: new ol.style.Stroke({
			color: '#2196F3',
			width: 2
			}),
			text: new ol.style.Text({
			font: '12px Calibri,sans-serif',
			fill: new ol.style.Fill({
				color: '#000'
			}),
			stroke: new ol.style.Stroke({
				color: '#fff',
				width:3
			})
			})
		})
        /*style: function(feature, resolution) {
          style.getText().setText(resolution < 5000 ? feature.get('name') : '');
          return style;
        } */
      });
	  Layer_Watersheds.setVisible(false);
 
var Layer_Boundaries = new ol.layer.Vector({
		source: new ol.source.Vector({
			//url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/tl_2011_us_aiannh.geojson',
			url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/tl_2011_BS_1hundthDD.geojson',
			//url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/tl_2011_BS_5hundthDD.geojson',
			//url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/tl_2011_PR_1hundthDD.geojson',
			format: new ol.format.GeoJSON()
			}),
			style: new ol.style.Style({
				fill: new ol.style.Fill({
				color: 'transparent'
				}),
				stroke: new ol.style.Stroke({
					color: '#009688',
					width: 2
				}),
				text: new ol.style.Text({
					font: '12px Calibri,sans-serif',
					fill: new ol.style.Fill({
						color: '#000'
					}),
					stroke: new ol.style.Stroke({
						color: '#fff',
						width: 3
					})
				}) 
			/*style: function(feature, resolution) {
				style.getText().setText(resolution < 5000 ? feature.get('NAME') : '');
				return style;
			} */
			})
});
Layer_Boundaries.setVisible(false);

var Layer_Settlements = new ol.layer.Vector({
        source: new ol.source.Vector({
		  url: 'https://nawrs.github.io/nawrs-data/JSON/Polygons/FtPec_21798_SS.geojson', //Placeholder link
          format: new ol.format.GeoJSON()
        }),
        style: function(feature, resolution) {
          style.getText().setText(resolution < 5000 ? feature.get('name') : '');
          return style;
        }
      });
	  Layer_Settlements.setVisible(false);
		


var refLayer = [Layer_States, Layer_Watersheds, Layer_Boundaries, Layer_Settlements];
var basemaps = [Layer_Stamen_terrain, Layer_OSM, Layer_USGSTopo,/*Layer_Stamen_watercolor*/];

 var myMap = new ol.Map({
	target: 'map',
	layers: [new ol.layer.Group({
            layers:basemaps
			}),
			new ol.layer.Group({
            layers: refLayer
			})
			],
	view: new ol.View({
		center: ol.proj.fromLonLat([-95,39]),
		zoom: 5
		})
	});  
	
function setMapType(newType) {
    if(newType == 'STAMEN_Terrain') {
        myMap.setLayerGroup(Layer_Stamen_terrain);
    } else if (newType == 'USGS_Topo') {
        myMap.setLayerGroup(Layer_USGSTopo);
    } else if (newType == 'OSM') {
        myMap.setLayerGroup(Layer_OSM);
    } else if (newType == 'STAMEN_Watercolor') {
		myMap.setLayerGroup(Layer_Stamen_watercolor);
	}
}
setMapType('STAMEN_Terrain')  


//from OL cookbook adding WMS layers
myMap.addLayer(Layer_States)
  opacity: 0.8;
  
myMap.addLayer(Layer_Watersheds)
  opacity: 0.85;
  
myMap.addLayer(Layer_Boundaries)
  opacity: 0.10;
  
myMap.addLayer(Layer_Settlements)
  opacity: 0.85;  
	
//from OpenLayers example Layer Group for checkboxes, calls layers from the addLayer section and the first in the array is apparently the setMapType basemap.

function bindInputs(layerid, layer) {
  var visibilityInput = $(layerid + ' input.visible');
  visibilityInput.on('change', function() {
    layer.setVisible(this.checked);
  });
  visibilityInput.prop('checked', layer.getVisible());
}

myMap.getLayers().forEach(function(layer, i) {
  bindInputs('#layer' + i, layer)
});
// end of OL layer group example	

/*  A function is needed to activate the bindInputs function after the setMapType has been changed. 
The layers only appear over the initial basemap.  
If it gets changed, the checkboxes for the layers no longer work.

function mapReset(){
		setMapType();
		bindInputs();
}

mapReset()  */
  
/* from OL vector layer example to highlight polygons and add name labels on mouse over. */
 var highlightStyleCache = {};

      var featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: myMap,
        style: function(feature, resolution) {
          var text = resolution < 5000 ? feature.get('NAME') : '';
          if (!highlightStyleCache[text]) {
            highlightStyleCache[text] = new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: '#FFEB3B',
                width: 1
              }),
              fill: new ol.style.Fill({
                color: 'rgba(255,255,0,0.2)'
              }),
              text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                text: text,
                fill: new ol.style.Fill({
                  color: '#000'
                }),
                stroke: new ol.style.Stroke({
                  color: '#FFEB3B',
                  width: 3
                })
              })
            });
          }
          return highlightStyleCache[text];
        }
      });

      var highlight;
      var displayFeatureInfo = function(pixel) {

        var feature = myMap.forEachFeatureAtPixel(pixel, function(feature) {
          return feature;
        });

        var info = document.getElementById('info');
        if (feature) {
          info.innerHTML = feature.getId() + ': ' + feature.get('NAME');
        } else {
          info.innerHTML = '&nbsp;';
        }

        if (feature !== highlight) {
          if (highlight) {
            featureOverlay.getSource().removeFeature(highlight);
          }
          if (feature) {
            featureOverlay.getSource().addFeature(feature);
          }
          highlight = feature;
        }

      };

      myMap.on('pointermove', function(evt) {
        if (evt.dragging) {
          return;
        }
        var pixel = myMap.getEventPixel(evt.originalEvent);
        displayFeatureInfo(pixel);
      });

      myMap.on('click', function(evt) {
        displayFeatureInfo(evt.pixel);
      });