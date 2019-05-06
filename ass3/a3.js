const cent = 100;
const svgHeight = 500;
const svgWidth = 800;
const mapHeight = 400;
const mapWidth = 800;
const missingDataColor = 'red';
const mapBoxToken = "pk.eyJ1Ijoic2p1amphdmFyYXB1IiwiYSI6ImNqdHJ5bW1jejBzaXY0NHBjZzR5Ymx4dnUifQ.qHoA6YgbR8vJculztKOotQ";
let map;

function appendSvg(divId, width = svgWidth, height = svgHeight) {
  d3.select(divId).append("svg")
    .attr("width", width)
    .attr("height", height);
}

function createProjection(data) {
  let projection = d3.geoConicConformal()
    .parallels([41.71666666667, 42.68333333333])
    .rotate([75, 0])
    .center([-71.5, 41])
    .fitExtent([[0, 0], [mapWidth, mapHeight]], data)
  return projection
}

function getColorScale() {
  return d3.scaleSequential(d3.interpolateViridis).domain([0, cent])
}

function createColorLegend(mapSvg, height = mapHeight, opacity = 1.0) {
  let colorScale = getColorScale();
  let leftPadding = 50;
  let legendWidth = 600;
  let legendHeight = 30;
  let topPadding = height + 20;
  let legendFontSize = 20;
  let tickSize = 3;

  //Legend ColorMap
  for (let i = 0; i <= legendWidth; i++) {
    mapSvg.append("rect")
      .attr("x", i + leftPadding)
      .attr("y", topPadding)
      .attr("width", 1)
      .attr("height", legendHeight)
      .attr("fill", colorScale(i * cent / legendWidth))
      .attr("fill-opacity", opacity);
  }
  // Legend Text
  for (let i = 0; i <= 100; i += 10) {
    mapSvg.append("line")
      .attr("x1", leftPadding + i * legendWidth / cent + 1)
      .attr("y1", topPadding + legendHeight)
      .attr("x2", leftPadding + i * legendWidth / cent + 1)
      .attr("y2", topPadding + legendHeight + tickSize)
      .attr("stroke", colorScale(i))
      .attr("fill-opacity", opacity);

    mapSvg.append("text")
      .attr("x", leftPadding + i * legendWidth / cent)
      .attr("y", topPadding + legendHeight + legendFontSize)
      .text(i)
      .style("font-size", `${legendFontSize}`)
      .attr("fill", colorScale(i))
      .attr("fill-opacity", opacity);
  }

  //Missing Data
  mapSvg.append("rect")
    .attr("x", legendWidth + leftPadding + 50)
    .attr("y", topPadding)
    .attr("width", legendHeight)
    .attr("height", legendHeight)
    .attr("fill", missingDataColor)
    .attr("fill-opacity", opacity);
  mapSvg.append("text")
    .attr("x", legendWidth + leftPadding + 40)
    .attr("y", topPadding + legendHeight + legendFontSize)
    .text("Missing Data")
    .style("font-size", `${legendFontSize}`)
    .attr("fill", missingDataColor)
    .attr("fill-opacity", opacity);
}

function createMap(divId, data, projection, attribute = "") {
  let mapSvg = d3.select(divId).select("svg")

  let colorScale = getColorScale();
  let path = d3.geoPath()
    .projection(projection);

  // Draw Map
  mapSvg.selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("id", (d) => `${attribute}_${d.properties.OBJECTID}`)
    .attr("stroke", "gray")
    .attr("fill", function (d) {
      if (attribute === "")
        return "#FD7F7C";
      else if (d.properties[attribute] === "")
        return missingDataColor;
      else
        return colorScale(d.properties[attribute]);
    });

  // Don't plot legend for first map
  if (attribute != "") {
    createColorLegend(mapSvg);
  }
}

function addAttributesDataToFeaturesProperties(mapData, housingData, attributes) {
  let noOfTowns = housingData.length;
  let mapDataCount = mapData['features'].length;
  for (let idxTown = 0, idxMapData = 0; idxTown < noOfTowns && idxMapData < mapDataCount;) {
    let mapDataFeature = mapData['features'][idxMapData];
    let townData = housingData[idxTown];
    attributeValue = "";
    if (mapDataFeature.properties.TOWN_ID == townData.muni_id) {
      attributes.forEach(attribute => mapDataFeature.properties[attribute] = townData[attribute]);
      idxMapData++;
    }
    else {
      idxTown++;
    }
  }
}

function addLmaps(divId) {
  // Add map to div
  map = L.map(divId).setView([42.1, -71.5], 8);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: mapBoxToken
  }).addTo(map);
  L.svg().addTo(map);
}

function overlayProjectPoint(x, y) {
  let point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

function drawOverlayFeatures(divId, data, attribute) {
  let svg = d3.select(`#${divId}`).select("svg");
  let transform = d3.geoTransform({ point: overlayProjectPoint });
  let path = d3.geoPath().projection(transform);
  let colorScale = getColorScale();

  let featureElement = svg.selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("stroke", "black")
    .attr("fill", function (d) {
      if (d.properties[attribute] === "")
        return missingDataColor;
      else
        return colorScale(d.properties[attribute]);
    })
    .attr("fill-opacity", 0.6);

  // Update mapSVG when center changed
  map.on("moveend", update);
  update();
  function update() {
    featureElement.attr("d", path);
  }
}

function createOverlay(divId, data, attribute) {
  let div = d3.select(`#${divId}`)
    .style("height", `${svgHeight}px`)
    .style("width", `${svgWidth}px`)
    .style("margin-left", "100px");
  // Map
  let mapId = `${divId}-map`;
  div.append('div')
    .attr("id", mapId)
    .style("width", `${mapWidth}px`)
    .style("height", `${mapHeight}px`);
  addLmaps(mapId);
  drawOverlayFeatures(mapId, data, attribute);
  // Legend
  let legendSVG = div.append("svg")
    .attr("width", mapWidth)
    .attr("height", svgHeight - mapHeight);
  createColorLegend(legendSVG, 0, 0.6);
}

function createVis(data) {
  let mapData = data[0];
  let housingData = data[1];

  // call your own functions from here, or embed code here
  // Sort mapData and housingData according to TOWN_ID and seq_id
  mapData.features.sort((a, b) => { return a.properties.TOWN_ID - b.properties.TOWN_ID });
  housingData.sort((a, b) => a.seq_id - b.seq_id);

  let attributes = ["hhinc10k", "hhinc20k", "hhinc30k", "hhinc40k",
    "hhinc50k", "hhinc60k", "hhinc70k", "hhinc80k",
    "hhinc90k", "hhinc100k", "hhinc110k", "hhinc120k"];

  addAttributesDataToFeaturesProperties(mapData, housingData, attributes);

  let divId1 = "#towns-map";
  let divId2 = "#towns-30k";
  let divId3 = "#towns-80k";
  let divId4 = "towns-overlay";
  let divId5 = "#towns-allk";

  let attribute10k = "hhinc10k";
  let attribute30k = "hhinc30k";
  let attribute80k = "hhinc80k";
  let projection = createProjection(mapData);

  // Create MA Towns Map
  appendSvg(divId1);
  createMap(divId1, mapData.features, projection);

  // Create MA Housing Affordability ($30k+)
  appendSvg(divId2);
  createMap(divId2, mapData.features, projection, attribute30k);

  // Create MA Housing Affordability ($80k+)
  appendSvg(divId3);
  createMap(divId3, mapData.features, projection, attribute80k);

  // MA Overlay
  createOverlay(divId4, mapData, attribute80k);

  // Extra Credit: MA Housing Affordability (Interactive)
  appendSvg(divId5);
  createMap(divId5, mapData.features, projection, attribute10k);

  // Slider function
  window.changeAffordability = function (attrIdx) {
    let attribute = attributes[attrIdx];
    let colorScale = getColorScale();

    // Change colors according to data
    mapData['features'].forEach(function (data) {
      let pathEle = d3.select(`#${attribute10k}_${data.properties.OBJECTID}`);
      pathEle.transition()
        .attr("fill", data.properties[attribute] === "" ? missingDataColor : colorScale(data.properties[attribute]))
        .duration(1000);
    });
  }
}

Promise.all([d3.json("https://gist.githubusercontent.com/dakoop/69c31771a040f8be86d73e7b31de6528/raw/daf94ffbe5ff7740cd92e4f5691a33b05a4ecc1b/ma-towns.json"),
d3.csv("https://gist.githubusercontent.com/dakoop/69c31771a040f8be86d73e7b31de6528/raw/daf94ffbe5ff7740cd92e4f5691a33b05a4ecc1b/ma-housing-affordability.csv")])
  .then(createVis);
