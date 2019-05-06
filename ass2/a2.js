function getTotals(data) {
    // get age ranges from first item (same for each item in the array)
    ranges = Object.keys(data[0]).filter(d => d != "day");
    return data.map(function (d) {
        return {
            "day": d.day,
            "total": ranges.reduce(function (t, s) { return t + d[s]; }, 0)
        };
    });
}

var bikeData;
function makeStacked(data) {
    // YOUR CODE HERE
    var svgWidth = 800;
    var svgHeight = 400;
    var restructuredData = data.map(function (dayData) {
        let dayObject = {};
        var count = 0;
        for (var key in dayData) {
            if (key >= 70) {
                count = count + dayData[key];
            }
            else {
                dayObject[key] = dayData[key];
            }
        }
        dayObject["70+"] = count;
        return dayObject;
    });
    var labels = ["70+", "60", "50", "40", "30", "20", "10"];
    var colors = ["#F3D06E", "#C0C464", "#8FB75D", "#62A55A", "#469253", "#327E48", "#1A6B38"].reverse();
    var stack = d3.stack().keys(labels);
    var stackedData = stack(restructuredData);
    var maxBarHeight = d3.max(stackedData[6], d => d[1]);
    var scaleY = d3.scaleLinear().range([0, svgHeight]).domain([maxBarHeight, 0]);
    var barWidth = 15;
    var spaceBetweenBars = 2;
    var stackedDiv = d3.select("div#stacked");
    var leftMargin = 100;

    var svg = stackedDiv.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight + 100);
    var groups = svg.selectAll("g").data(stackedData).enter().append("g");
    groups.selectAll("rect")
        .data(function (d, i) { d.map(function (a) { a["color"] = colors[i] }); return d; })
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return leftMargin + i * (barWidth + spaceBetweenBars);
        })
        .attr("y", function (d) {
            return scaleY(d[1]);
        })
        .attr("width", barWidth)
        .attr("height", function (d) {
            return scaleY(d[0]) - scaleY(d[1]);
        })
        .attr("fill", function (d) { return d['color'] });

    var x_axis = d3.axisBottom()
        .scale(d3.scaleLinear().domain([1, 31]).range([105, 620])).ticks(31);
    svg.append("g").attr("transform", `translate(0, ${svgHeight})`).call(x_axis);

    var y_axis = d3.axisLeft()
        .scale(d3.scaleLinear().domain([maxBarHeight, 0]).range([0, svgHeight]));
    svg.append("g").attr("transform", `translate(100, 0)`).call(y_axis);

    var legend = svg.append("g").attr("transform", "translate(650, 10)");
    legend.selectAll('rect').data(colors.reverse())
        .enter()
        .append('rect')
        .attr("x", "35")
        .attr("y", function (d, i) {
            return i * 15 + 20;
        })
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", function (d) { return d });

    legend.selectAll('text').data(labels.reverse())
        .enter()
        .append('text')
        .text(function (d) { return d; })
        .attr("x", "5")
        .attr("y", function (d, i) {
            return i * 15 + 31;
        });

    legend.append('text')
        .style("font-weight", "bold")
        .text("Age Ranges")
        .attr("x", "5")
        .attr("y", "5");

    svg.append('text')
        .style("font-weight", "bold")
        .text("Day")
        .attr("y", svgHeight + 30)
        .attr("x", "350")

    svg.append('text')
        .style("font-weight", "bold")
        .attr("transform", "rotate(270, 90, 90)")
        .text("Number of Bike Trips")
        .attr("y", "40")
        .attr("x", "-50")

}

d3.json("https://gitcdn.xyz/repo/dakoop/722724236876db13af3c7f3f11e7eee4/raw/9e7073bf3a943c514ca61aedc9865c616c9d77da/bikeData.json").then(makeStacked);
