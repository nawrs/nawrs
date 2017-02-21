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
	  

var Layer_States = new ol.layer.Vector({
        source: new ol.source.Vector({
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/us_state_PR_1hundthDD.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/us_state_BS_5hundthDD.geojson',
		  url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/us_state_BS_1hundthDD.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/cb_2015_us_state_500k.geojson', 
          format: new ol.format.GeoJSON(),
        }),
      });
	  Layer_States.setVisible(true);

var Layer_Watersheds = new ol.layer.Vector({
        source: new ol.source.Vector({
		  url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/wbdhu2_PR_1hundthDD.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/wbdhu2_BS_5hundthDD.geojson',
		  //url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/wbdhu2_BS_1hundthDD.geojson',
          format: new ol.format.GeoJSON(),
        }),
        style: function(feature, resolution) {
          style.getText().setText(resolution < 5000 ? feature.get('name') : '');
          return style;
        }
      });
	  Layer_Watersheds.setVisible(true);
 
var Layer_Boundaries = new ol.layer.Vector({
		source: new ol.source.Vector({
			url: 'https://raw.githubusercontent.com/nawrs/nawrs/GeoJSON/JSON/ReferenceLayers/tl_2011_us_aiannh.geojson',
			format: new ol.format.GeoJSON()
			}),
		  style: function(feature, resolution) {
			style.getText().setText(resolution < 5000 ? feature.get('name') : '');
			return style;
			}
		});
		Layer_Boundaries.setVisible(true);

var Layer_Settlements = new ol.layer.Vector({
        source: new ol.source.Vector({
		  url: 'https://nawrs.github.io/nawrs-data/JSON/Polygons/FtPec_21798_SS.geojson', //initial working link
          format: new ol.format.GeoJSON()
        }),
        style: function(feature, resolution) {
          style.getText().setText(resolution < 5000 ? feature.get('name') : '');
          return style;
        }
      });
	  Layer_Settlements.setVisible(true);
		


var Layer_Stamen_watercolor = new ol.layer.Group({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.Stamen({layer: 'watercolor'})
        })
    ]
});

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
  opacity: 0.50
}));

var myMap = new ol.Map({
	layers: [
              Layer_States,
			  Layer_Watersheds,
			  Layer_Boundaries,
			  Layer_Settlements,
            ],
	target: 'map',
	view: new ol.View({
		center: ol.proj.fromLonLat([-95,39]),
		zoom: 5
		})
	});

/* from OL 3 Examples layer group example
  var map = new ol.Map({
	 layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          }), new ol.layer.Group({
            layers: [
              Layer_States,
			  Layer_Watersheds,
			  Layer_Boundaries,
			  Layer_Settlements,
            ]
          })
        ],
	target: 'map',
	view: new ol.View({
		center: ol.proj.fromLonLat([-95,39]),
		zoom: 5
		})
	});  */

 function bindInputs(layerid, layer) {
        var visibilityInput = $(layerid + ' input.visible');
        visibilityInput.on('change', function() {
          layer.setVisible(this.checked);
        });
        visibilityInput.prop('checked', layer.getVisible());
 }
 map.getLayers().forEach(function(layer, i) {
        bindInputs('#layer' + i, layer);
        if (layer instanceof ol.layer.Group) {
          layer.getLayers().forEach(function(sublayer, j) {
            bindInputs('#layer' + i + j, sublayer);
          });
        }
      });

      $('#layertree li > span').click(function() {
        $(this).siblings('fieldset').toggle();
      }).siblings('fieldset').hide();
	  
	  
/*function setMapLayer(newLayer) {
	if(newLayer == 'states') {
		myMap.setLayerGroup(Layer_States);
	} else if (newLayer == 'watersheds') {
		myMap.setLayerGroup(Layer_Watersheds);
	} else if (newLayer == 'boundaries') {
		myMap.setLayerGroup(Layer_Boundaries);
	} else if (newLayer == 'settlements') {
		myMap.setLayerGroup(Layer_Settlements);
	}
}
*/
	

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
	