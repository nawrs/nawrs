 var style = new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.6)'
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
		 style: function(feature, resolution) {
          style.getText().setText(resolution < 5000 ? feature.get('name') : '');
          return style;
        }
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
		


      var map = new ol.Map({
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          }),
          Layer_States,
		  Layer_Watersheds,
		  Layer_Settlements
        ],
        target: 'map',
        view: new ol.View({
          center: ol.proj.fromLonLat([-95,39]),
		zoom: 5
        })
      });

      var highlightStyleCache = {};

      var featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: map,
        style: function(feature, resolution) {
          var text = resolution < 5000 ? feature.get('name') : '';
          if (!highlightStyleCache[text]) {
            highlightStyleCache[text] = new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: '#f00',
                width: 1
              }),
              fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0.1)'
              }),
              text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                text: text,
                fill: new ol.style.Fill({
                  color: '#000'
                }),
                stroke: new ol.style.Stroke({
                  color: '#f00',
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

        var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
          return feature;
        });

        var info = document.getElementById('info');
        if (feature) {
          info.innerHTML = feature.getId() + ': ' + feature.get('name');
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

      map.on('pointermove', function(evt) {
        if (evt.dragging) {
          return;
        }
        var pixel = map.getEventPixel(evt.originalEvent);
        displayFeatureInfo(pixel);
      });

      map.on('click', function(evt) {
        displayFeatureInfo(evt.pixel);
      });