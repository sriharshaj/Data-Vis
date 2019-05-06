function legend(colorScale) {
  let width = 300,
    height = 20,
    reverse = false,
    vertical = false,
    n = 512;

  function legend(g) {
    const internalScale = colorScale.copy().domain([0, 1]);
    const canvas = document.createElement("canvas");
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const context = d3.select(canvas)
      .attr("width", vertical ? 1 : n)
      .attr("height", vertical ? n : 1)
      .style("imageRendering", "pixelated")
      .node().getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = internalScale((reverse ? n - i : i) / (n - 1));
      context.fillRect(vertical ? 0 : i, vertical ? i : 0, 1, 1);
    }

    const legend = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    legend.setAttribute("width", width);
    legend.setAttribute("height", height);
    legend.appendChild(canvas);
    g.node().appendChild(legend);

    if (vertical) {
      const colorLegendScale = d3.scaleLinear().domain(colorScale.domain()).range(reverse ? [height - 1, 0] : [0, height - 1]);
      const legendAxis = d3.axisRight(colorLegendScale);
      g.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .call(legendAxis);
    } else {
      const colorLegendScale = d3.scaleLinear().domain(colorScale.domain()).range(reverse ? [width - 1, 0] : [0, width - 1]);
      const legendAxis = d3.axisBottom(colorLegendScale);
      g.append("g")
        .attr("transform", "translate(0, " + height + ")")
        .call(legendAxis);
    }
  }

  legend.width = function (value) {
    if (!arguments.length) return width;
    width = value;
    return legend;
  };

  legend.height = function (value) {
    if (!arguments.length) return height;
    height = value;
    return legend;
  };

  legend.reverse = function (value) {
    if (!arguments.length) return reverse;
    reverse = value;
    return legend;
  };

  legend.vertical = function (value) {
    if (!arguments.length) return vertical;
    vertical = value;
    return legend;
  };

  legend.resolution = function (value) {
    if (!arguments.length) return n;
    n = value;
    return legend;
  };

  return legend;
}

function createMap(mapData, divId) {
  const w = 800, h = 600;

  const svg = d3.select(divId).append("svg")
    .attr("width", w)
    .attr("height", h);

  const proj = d3.geoConicConformal()
    .parallels([41 + 43 / 60, 42 + 41 / 60])
    .rotate([71 + 1 / 2, -41])
    .fitExtent([[10, 10], [w - 20, h - 20]], mapData);

  const path = d3.geoPath().projection(proj);

  svg.selectAll(".town")
    .data(mapData.features)
    .join("path")
    .attr("d", path)
    .attr("class", d => "town town" + d.properties.TOWN_ID)
    .style("stroke", "black")
    .append("title").text(d => d.properties.TOWN);

  return svg;
}

function filterHousingMap(divId, lowPop, highPop) {
  const svg = d3.select(divId).select("svg");
  svg.selectAll(".town")
    .style("fill", (d) => { d.properties.color2 = undefined; return (d == null ? "gray" : d.properties.color) })
    .filter((d, i) => d == null ? true : !(
      highPop == 100000.00 ? d.properties.POP2010 >= lowPop : d.properties.POP2010 <= highPop && d.properties.POP2010 >= lowPop
    ))
    .style("fill", function (d) { d.properties.color2 = "#edeff2"; return d.properties.color2 });
}

function createHousingMap(mapData, housingData, divId, income) {
  const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 30]);

  const svg = createMap(mapData, divId);
  const lookup = new Map(housingData.map(d => [d.muni_id, d[income]]));

  svg.selectAll(".town")
    .style("fill", d => { const c = lookup.get("" + d.properties.TOWN_ID); d.properties.color = (c !== undefined ? color(c) : "gray"); return d.properties.color });

  const leg = legend(color)
    .width(400);

  svg.append("g")
    .attr("transform", "translate(50, 400)")
    .call(leg);

  return lookup;
}

function createSlider(sliderId) {
  const slider = document.querySelector(sliderId);
  noUiSlider.create(slider, {
    start: [0, 100000],
    range: {
      'min': [0],
      'max': [100000]
    },
    connect: true,
    pips: {
      mode: 'values',
      // density: 20,
      values: [0, 20000, 40000, 60000, 80000, 100000],
      format: {
        to: function (value) {
          if (value == "100000") {
            return value + '+';
          }
          return value;
        },
        from: function (value) {
          if (value == "100000+") {
            return value.replace('+', '');
          }
          return value;
        }
      }
    }
  });
  // specify the change callback
  slider.noUiSlider.on("update", function () {
    let popRange = slider.noUiSlider.get();
    let lowValue = parseInt(popRange[0]);
    let highValue = parseInt(popRange[1]);
    filterHousingMap("#towns-30k", lowValue, highValue);
    filterHousingMap("#linked", lowValue, highValue);
  });
}


function createHistogram(subsidizedData, divId) {
  let width = 480,
    height = 320;

  const svg = d3.select(divId).append("svg")
    .attr("width", width)
    .attr("height", height);

  const margin = { top: 10, right: 30, bottom: 30, left: 30 };
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;
  g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const x = d3.scaleLinear()
    .domain([0, 26]).nice(13)
    .rangeRound([0, width]);

  // delete these lines and create a histogram from the spending data here!
  const ticks = x.ticks();
  const histogram = d3.histogram().value((d) => d.subPct).domain(x.domain());
  const histData = histogram(subsidizedData.filter(d => d.subPct != 0));

  const y = d3.scaleLinear()
    .domain([0, d3.max(histData.map(d => d.length))])
    .range([height, 0]);

  g.selectAll(".bar")
    .data(histData)
    .enter().append("rect")
    .attr("x", (d, i) => x(ticks[i]))
    .attr("y", d => y(d.length))
    .attr("width", (d, i) => x(ticks[i + 1]) - x(ticks[i]) - 1)
    .attr("height", (d) => height - y(d.length))
    .attr("class", "bar")
    .style("stroke-width", "1px")
    .style("stroke", "white");

  g.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
}

function createLinked(mapData, housingData, subsidizedData, divId, income) {
  createHousingMap(mapData, housingData, divId + ' .map', income);
  createHistogram(subsidizedData, divId + ' .hist');

  //add event handlers to implement linked highlighting
  highlightLinkedMap(divId);
  highlightLinkedHistogram(divId);
}

function highlightLinkedMap(divId) {
  const svg = d3.select(`${divId} .hist`).select("svg");
  svg.selectAll(".bar").on("mouseover", function (d) {
    d3.select(this).attr("fill", "red");
    filterHousingMapInterations(divId, d.map(x => x.community.toUpperCase()));
  }).on("mouseout", function () {
    d3.select(this).attr("fill", "black");
    filterHousingMapInterations(divId, []);
  });
}

function highlightLinkedHistogram(divId) {
  const mapSvg = d3.select(`${divId} .map`).select("svg");
  mapSvg.selectAll(".town").on("mouseover", function (d) {
    highlightHistogram(d.properties.TOWN);
  })
    .on("mouseout", function () {
      highlightHistogram();
    });
  function highlightHistogram(town) {
    const histSvg = d3.select(`${divId} .hist`).select("svg");
    const bar = histSvg.selectAll(".bar");
    if (town == undefined) {
      bar.attr("fill", "black");
    }
    else {
      bar.filter((d) => (d.map(x => x.community.toUpperCase())).includes(town)).attr("fill", "red");
    }
  }
}

function filterHousingMapInterations(divId, towns) {
  const svg = d3.select(`${divId} .map`).select("svg");
  svg.selectAll(".town")
    .style("fill", function (d) {
      if (d == null) {
        return "gray";
      }
      else if (towns.includes(d.properties.TOWN)) {
        return d.properties.color;
      }
      else if (towns.length == 0) {
        return d.properties.color2 || d.properties.color;
      }
      else {
        return "#edeff2";
      }
    });
}

function createVis(data) {
  let mapData = data[0];
  let housingData = data[1];
  let subsidizedData = data[2];

  createSlider("#controls");
  createHousingMap(mapData, housingData, "#towns-30k", "hhinc30k");
  createHistogram(subsidizedData, '#towns-hist');
  createLinked(mapData, housingData, subsidizedData, "#linked", "hhinc30k");
}

Promise.all([d3.json("https://gist.githubusercontent.com/dakoop/69c31771a040f8be86d73e7b31de6528/raw/daf94ffbe5ff7740cd92e4f5691a33b05a4ecc1b/ma-towns.json"),
d3.csv("https://gist.githubusercontent.com/dakoop/69c31771a040f8be86d73e7b31de6528/raw/daf94ffbe5ff7740cd92e4f5691a33b05a4ecc1b/ma-housing-affordability.csv"),
d3.csv("https://gist.githubusercontent.com/dakoop/69c31771a040f8be86d73e7b31de6528/raw/551f3aa0bbd042feea272f7a03f3c61a307a9dd6/ma-subsidized-housing.csv")])
  .then(createVis);