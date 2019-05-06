function getTotals(bikeData) {
  return bikeData.map(dayTickets => dayTickets.reduce((acc, val) => acc + val));
}

function createElement(name, attrs, appendTo, textContent) {
  var element = document.createElementNS("http://www.w3.org/2000/svg", name);
  if (attrs === undefined) attrs = {};
  for (var key in attrs) {
    element.setAttributeNS(null, key, attrs[key]);
  }
  if (appendTo) {
    appendTo.appendChild(element);
  }
  if (name == 'text') {
    element.appendChild(document.createTextNode(textContent));
  }
  return element;
}

function highlightDay(highlightedDay) {
  createBarChart(highlightedDay);
}

function createBarChart(highlightedDay) {
  var barChartDiv = document.getElementById('barchart');

  // Remove previous bar chart if any
  barChartDiv.removeChild(barChartDiv.childNodes[0]);


  if (highlightedDay == undefined) {
    highlightedDay = 0;
  }

  var svgWidth = 600;
  var svgHeight = 400;
  var svgAttrs = { height: svgHeight, width: svgWidth };
  var svgElement = createElement('svg', svgAttrs, barChartDiv);

  // Get sum of tickets group by each day
  var sumByDay = getTotals(bikeData);

  var daysInJuly = 31;
  var maxBarChartHeight = 350;
  var maxBarChartWidth = 550;
  var maxTicketCountInSingleDay = Math.max(...sumByDay);
  var scale = maxBarChartHeight / maxTicketCountInSingleDay;

  createElement('line', { x1: 50, y1: 0, x2: 50, y2: 350, stroke: 'black' }, svgElement);
  var x = svgWidth - maxBarChartWidth;
  for (var idx in sumByDay) {
    var width = parseInt(maxBarChartWidth / daysInJuly);
    var height = sumByDay[idx] * scale;
    var y = maxBarChartHeight - height;
    var fillColor = "green";
    if (parseInt(idx) + 1 == parseInt(highlightedDay)) {
      fillColor = 'red';
    }
    var rectAttrs = { height: height, width: width, x: x, y: y, fill: fillColor, stroke: 'black' };
    createElement('rect', rectAttrs, svgElement);
    x = x + width;
  }

  //Adding X axis and Y axis
  textElementY1 = createElement('text', { x: 0, y: 15 }, svgElement, maxTicketCountInSingleDay);
  textElementY2 = createElement('text', { x: 0, y: maxBarChartHeight - 5 }, svgElement, 0);
  textElementY3 = createElement('text', { x: 0, y: 170 }, svgElement, "#Rides");
  textElementX1 = createElement('text', { x: 50, y: 370 }, svgElement, 1);
  textElementX2 = createElement('text', { x: 300, y: 370 }, svgElement, "July");
  textElementX3 = createElement('text', { x: 560, y: 370 }, svgElement, 31);
}

window.onload = createBarChart;