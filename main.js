var map, windowSize, mapMaxZoom,
    visitedMLBparks = 0, plannedMLBparks = 0;

map = L.map("map", {
  center: [39.92, -92.19],
  zoom: 5,
  minZoom: 2,
  maxZoom: 19
});

windowSize = $(window).width();
mapMaxZoom = map.getMaxZoom();

if (windowSize > 600) {
  collapseLegend = false;
} else {
  collapseLegend = true;
}

var esriServiceUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
var esriAttribution = 'Tiles &copy; Esri';

var esriTopo = L.tileLayer(esriServiceUrl + 'World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	minZoom: 2,
  maxZoom: 15,
  attribution: esriAttribution
}).addTo(map);

var esriSatellite = L.tileLayer(esriServiceUrl + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
   minZoom: 15,
   maxZoom: mapMaxZoom,
   attribution: esriAttribution
}).addTo(map);

var esriRoadsReference = L.tileLayer(esriServiceUrl + 'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
  minZoom: 15,
  maxZoom: mapMaxZoom,
  attribution: esriAttribution
}).addTo(map);

var esriReference = L.tileLayer(esriServiceUrl + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
  minZoom: 15,
  maxZoom: mapMaxZoom,
  attribution: esriAttribution
}).addTo(map);

function setPopupContent (feature, layer) {
	
    var popupContent = "<b style='font-size:20px;'>" + feature.properties.ballparkName + "</b><br/>";
        popupContent += "<b>Home Team:</b> " + feature.properties.teamName + "<br/>";
        popupContent += "<b>Visitors:</b> " + feature.properties.vistingteamName + "<br/>";
	popupContent += "<b>Score:</b> " + feature.properties.score + "<br/>";	
	
  if (feature.properties.comments) {
    popupContent += "<br/>" + feature.properties.comments + "<br/>";
  }
  
  if (feature.properties.visited) {
    popupContent += "<b>Game Date:</b> " + feature.properties.visited + "<br/>";
    if (feature.properties.ballparkName) {
      if (feature.properties.visited != 'N/A' && feature.properties.visited != 'Planned') {
        visitedMLBparks = visitedMLBparks + 1;
      } else if (feature.properties.visited === 'Planned') {
        plannedMLBparks = plannedMLBparks + 1;
      }
    }
  }
  
  if (feature.properties.notes) {
    popupContent += "<b>Notes:</b> " + feature.properties.notes + "<br/>";
  }
  if (feature.properties.photo) {
    popupContent += "<div class='center'>";
    if (feature.properties.photoType == "portrait") {
      popupContent += "<img class='popupPortrait' src='photos/" + feature.properties.photo + "'></img>";
    } else if (feature.properties.photoType == "ballpark") {
      popupContent += "<img class='ballparkPhoto' src='photos/" + feature.properties.photo + "'></img>";
    } else {
      popupContent += "<img class='popupPhoto' src='photos/" + feature.properties.photo + "'></img>";
    }
    popupContent += "</div>";
  }
	layer.bindPopup(popupContent);
}

function updateAttributeWindow (hover) {
  var attributeInfo = hover.target.feature.properties;
  attributeWindow.update(attributeInfo);
}

var mlbBallparks = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: setColor(feature.properties.visited),
      color: '#FFF',
      fillOpacity: 0.8
    });
  },
  onEachFeature: setPopupContent
});
$.getJSON("places/ballparks.json", function (data) {
	mlbBallparks.addData(data).addTo(map);
});

function setColor (value) {
  switch (value) {
    case 'N/A':                             return '#8E0152';
    case 'Planned':                         return '#DE77AE';
    default:                                return '#276419';
  }
}

var overlayMaps = {
    "<b>Ballparks</b><span><br/><span id='visited' class='legendSymbol'></span>  Visited<br/><span id='planned' class='legendSymbol'></span>  Planned<br/><span id='remaining' class='legendSymbol'></span>  Remaining<br/><span id='mlbSolo' class='legendSymbol'></span> Solo visit</span>": mlbBallparks,
};

//Zoom to the respective layer if checking it on in the legend
//If another layer is active, emit a click to remove it from the map view.
map.on('overlayadd', function (layer) {
  var toggleItem;
    var activeLayer = mlbBallparks;
    var getMLBParksPercent = ((visitedMLBparks/30) * 100).toFixed(1);
    attributeWindow._div.innerHTML = '<h2>Ballparks</h2>' +
    "<p><b>Planned:</b> " + plannedMLBparks + "<br />" +
    "<b>Visited:</b> " + visitedMLBparks + " of " + mlbBallparks.getLayers().length + " (" + getMLBParksPercent + "%)</p>";
    toggleItem = $(".leaflet-control-layers-selector")[0];
  map.fitBounds(activeLayer.getBounds());
  if (toggleItem.checked) { $(toggleItem).trigger('click'); }
});

var attributeWindow = L.control({position: 'bottomleft'});

attributeWindow.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'attributeWindow');
    return this._div;
};

attributeWindow.addTo(map);
