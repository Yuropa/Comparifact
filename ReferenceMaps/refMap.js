var allMaps = [];

function generateMap(name, annotations, mapStyle, extent) {
    // Hack to allow multiple popups
    L.Map = L.Map.extend({
        openPopup: function(popup) {
            // this.closePopup();  // just comment this
            this._popup = popup;
            return this.addLayer(popup).fire('popupopen', {
                popup: this._popup
            });
        }
    });
    
    
    L.TileLayer.d3_topoJSON = L.TileLayer.extend({
        onAdd: function (map) {
            L.TileLayer.prototype.onAdd.call(this, map);
            this._path = d3.geo.path().projection(function (d) {
                var point = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
                return [point.x, point.y];
            });
            this.on("tileunload", function (d) {
                if (d.tile.xhr) d.tile.xhr.abort();
                if (d.tile.nodes) d.tile.nodes.remove();
                d.tile.nodes = null;
                d.tile.xhr = null;
            });
        },
        _loadTile: function (tile, tilePoint) {
            var self = this;
            this._adjustTilePoint(tilePoint);

            if (!tile.nodes && !tile.xhr) {
                tile.xhr = d3.json(this.getTileUrl(tilePoint), function (error, tjData) {
                    if (error) {
                        console.log(error);
                    } else {
                        var geoJson = topojson.feature(tjData, tjData.objects[self.options.layerName]);
                        tile.xhr = null;
                        tile.nodes = d3.select(self._map._container).select("svg").append("g");
                        tile.nodes.selectAll("path")
                            .data(geoJson.features).enter()
                            .append("path")
                            .attr("d", self._path)
                            .attr("class", self.options.class)
                            .attr("style", self.options.style);
                    }
                });
            }
        }
    });
    
    function hasStyle(x) {
        for (var i = 0; i < mapStyle.length; i++) {
            if (x == mapStyle[i]) {
                return true;
            }
        }
        
        return false;
    }
    
    
    var useSatellite = hasStyle('terrain');
    var useReliefMap = hasStyle('relief');
    var useBasic = !useSatellite && !useReliefMap;
    
    var showLables = hasStyle('labels');
    var showBoundaries = hasStyle('boundaries');
    
    var showRoads = hasStyle('roads');
    var showPOI = false;
    var showLandUsage = hasStyle('land-usage');
    var showWater = hasStyle('water') && !useBasic;

    var map = L.map(document.getElementById(name), {zoomControl: false}).setView([47.6062095, -122.332070], 12);
    allMaps.push(map);
    map._initPathRoot();
    
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.keyboard.disable();

    // Disable tap handler, if present.
    if (map.tap) map.tap.disable();

    // Add a fake GeoJSON line to coerce Leaflet into creating the <svg> tag that d3_geoJson needs
    new L.geoJson({
        "type": "LineString",
        "coordinates": [[0, 0], [0, 0]]
    }, {
        "style" : {stroke: false, fill: false}
    }).addTo(map);
    
    var baseURL = '';
    if (useBasic) {
        baseURL = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    } else if (useSatellite) {
        baseURL = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    } else if (useReliefMap) {
        baseURL = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'
    }
    var basemap = L.tileLayer(baseURL, {
            attribution: '<a href="http://www.arcgis.com/home/item.html?id=9c5370d0b54f4de1b48a3792d7377ff2">ESRI shaded relief</a>, <a href="http://www.horizon-systems.com/NHDPlus/NHDPlusV2_home.php">NHDPlus v2</a>, OpenStreetMap',
            maxZoom: 13
    });
    basemap.addTo(map);
    
    if (showRoads) {
        // Highways from OpenStreetMap
        var layer = new L.TileLayer.d3_topoJSON("http://tile.openstreetmap.us/vectiles-highroad/{z}/{x}/{y}.topojson", {
            class: function(d) {
                return "road " + d.properties.kind;
            },
            layerName: "vectile",
            style: ""
        });
        layer.addTo(map);
    }
    
    /*
    if (showBuildings) {
        // Buildings from OpenStreetMap
        var layer = new L.TileLayer.d3_topoJSON("http://tile.openstreetmap.us/vectiles-buildings/{z}/{x}/{y}.topojson", {
            class: function(d) {
                return "building " + d.properties.kind;
            },
            layerName: "vectile",
            style: ""
        });
        layer.addTo(map);
    }
    */
    
    if (showPOI) {
        // Buildings from OpenStreetMap
        var layer = new L.TileLayer.d3_topoJSON("http://tile.openstreetmap.us/vectiles-pois/{z}/{x}/{y}.topojson", {
            class: function(d) {
                return "poi " + d.properties.kind;
            },
            layerName: "vectile",
            style: ""
        });
        layer.addTo(map);
    }
    
    if (showLandUsage) {
        // Buildings from OpenStreetMap
        var layer = new L.TileLayer.d3_topoJSON("http://tile.openstreetmap.us/vectiles-land-usages/{z}/{x}/{y}.topojson", {
            class: function(d) {
                return "landusage " + d.properties.kind;
            },
            layerName: "vectile",
            style: ""
        });
        layer.addTo(map);
    }
    
    if (showWater) {
        // Water Areas from OpenStreetMap
        var layer = new L.TileLayer.d3_topoJSON("http://tile.openstreetmap.us/vectiles-water-areas/{z}/{x}/{y}.topojson", {
            class: function(d) {
                return "water " + d.properties.kind;
            },
            layerName: "vectile",
            style: ""
        });
        layer.addTo(map);
    }

    if (showBoundaries && !useBasic) {
        var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
        var topLayer = new L.tileLayer('http://{s}.tile.stamen.com/toner-lines/{z}/{x}/{y}.png', {
            maxZoom: 17
        }).addTo(map);
        topPane.appendChild(topLayer.getContainer());
        topLayer.setZIndex(7);
    }
    
    if (showLables && !useBasic) {
        var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
        var topLayer = new L.tileLayer('http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png', {
            maxZoom: 17
        }).addTo(map);
        topPane.appendChild(topLayer.getContainer());
        topLayer.setZIndex(7);
    }
    
    function addMarker(lat, lng, title) {
        L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'reddot.png',
                iconRetinaUrl: 'reddot@2x.png',
                iconSize: [8, 8],
                iconAnchor: [4, 4],
                popupAnchor: [0, 0]

            }),
            alt: title,
            title: title,
            zIndexOffset: 1000
        })
        .addTo(map)
        .bindPopup('<b>' + title + '</b>', {
            closeOnClick: false,
            closeButton: false,
            className: 'hidden-popup-background',
            offset: L.point(0, 25),
            autoPan: false
        })
        .openPopup();
    }
    
    for (var i = 0; i < annotations.length; i++) {
        var annotation = annotations[i];
        addMarker(annotation.lat, annotation.lng, annotation.title);
    }
    
    map.exp_extent = extent;
}