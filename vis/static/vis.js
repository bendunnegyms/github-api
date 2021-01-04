function renderData() {
    var user_input = document.getElementById("usrin");
    user_input = user_input.value + "";
    input_test = user_input.split("/");
    console.log(user_input);
    if (user_input == "") {
        alert("shits fucked bigtime");
        return;
    }

    if (input_test.length == 1) {
        var entry = { "name": input_test[0], "status": "name_only" };
    } else if (input_test.length == 2) {
        var entry = { "name": input_test[0], "repo": input_test[1], "status": "name_and_repo" };
    } else {
        alert("shits fucked bigtime");
        return;
    }

    fetch("/func/", {
        method: 'POST',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(entry)
    }).then(function (response) {
        console.log(response.status);
        
        clearElements();
        if (entry["status"] == "name_and_repo") {
            d3.select("#data_display").style("display", "block")
            renderDAG();
            renderBarChart();
            pie_chart();
            render_readme();
        } else {
            d3.select("#data_display").style("display", "none")
            renderUserData();
        }

    });
}

function clearElements() {
    d3.select("#git_commits_dag").selectAll("*").remove();
    d3.select("#git_commits_bar_chart").selectAll("*").remove();
    d3.select("#pie_chart").selectAll("*").remove();
    d3.select("#data_display").selectAll("#readme").remove();

    d3.select("body").selectAll("#user_data").remove();
}



function addMetadataBox() {

}





function renderDAG() {

    var margin = { top: 10, right: 30, bottom: 30, left: 40 },
        width = 900,
        height = 400;


    var time = Date.now();
    var json_file = "/data/network_graph.json?u=" + time;
    d3.json(json_file, function (data) {
        console.log(data)

        var commit_count = "Commits: " + data.nodes.length

        var svg = d3.select("#git_commits_dag")
            .append("svg")
            .attr("class", "network_graph")
            .attr("height", height)
            .append("g");

        d3.select("#git_commits_dag").select("svg").append("text")
            .attr("transform", "translate(" + 5 + "," + (height - 5) + ")")
            .attr("z-index", 10)
            .text("Showing last " + data.nodes.length + " commits");

        var commit_count_header = svg.append("text")
            .attr("class", "commit_count_dag")
            .text(commit_count)

        var zoomRect = svg.append('rect')
            .attr("class", "zoom_rect")
            .attr("height", height)
            .attr("fill", "#fffff7");

        var nodes_data = data.nodes;
        var links_data = data.links;

        var simulation = d3.forceSimulation()
            .nodes(nodes_data);

        var link_force = d3.forceLink(links_data)
            .id(function (d) { return d.id; });

        var charge_force = d3.forceManyBody();

        var center_force = d3.forceCenter(width / 2, height / 2);

        simulation
            .force("charge_force", charge_force)
            .force("center_force", center_force)
            .force("links", link_force)
            ;


        //add tick instructions: 
        simulation.on("tick", tickActions);

        //add encompassing group for the zoom 
        var g = svg.append("g")
            .attr("class", "everything");

        //draw lines for the links 
        var link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links_data)
            .enter().append("line")
            .attr("stroke-width", 2)
            .style("stroke", "#aaa");

        var node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes_data)
            .enter()
            .append("g");

        var circle = node.append("circle")
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("r", 8)
            .style("fill", "#b41f2b")
            .style("transition", "fill-opacity .2s ease")
            .on("mouseover", function (d) {
                d3.select(this)
                    .attr("fill-opacity", ".8");
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .attr("fill-opacity", "1");
            });


        var labels = node.append("text")
            .text(function (d) {
                return d.date;
            })
            .attr('x', 18)
            .attr('y', 3)
            .attr("class", "node_label");

        node.append("title")
            .text(function (d) { return d.metadata; });



        var drag_handler = d3.drag()
            .on("start", drag_start)
            .on("drag", drag_drag)
            .on("end", drag_end);

        drag_handler(node);
        //Zoom functions 
        function zoom_actions() {
            g.attr("transform", d3.event.transform)
        }

        //add zoom capabilities 
        var zoom_handler = d3.zoom()
            .scaleExtent([0.1, 2])
            .on("zoom", zoom_actions);

        zoom_handler(zoomRect);

        /** Functions **/


        //Drag functions 
        //d is the node 
        function drag_start(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        //make sure you can't drag the circle outside the box
        function drag_drag(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function drag_end(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }



        function tickActions() {
            //update circle positions each tick of the simulation 
            node
                .attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; });

            circle
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });

            labels
                .attr("x", function (d) { return d.x + 10; })
                .attr("y", function (d) { return d.y - 5; });

            //update link positions 
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });
        }
    });


}







var regulatory_height = 0;

function renderBarChart() {

    var time = Date.now();
    var json_file = "/data/bar_chart_data.json?u=" + time;
    d3.json(json_file, function (data) {
        // set the dimensions and margins of the graph
        var margin = { top: 20, right: 30, bottom: 40, left: 160 },
            width = 500 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        var height = 33 * data.length
        regulatory_height = height;
        // append the svg object to the body of the page
        var svg = d3.select("#git_commits_bar_chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom - 11)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + ",0)");

        // Parse the Data

        // Add X axis
        var x = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return d.commits; })])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(0,0)")
            .style("text-anchor", "end");

        // Y axis
        var y = d3.scaleBand()
            .range([0, height])
            .domain(data.map(function (d) { return d.author; }))
            .padding(.1);
        svg.append("g")
            .attr("class", "y_axis")
            .call(d3.axisLeft(y))

        var defs = svg.append("defs");
        // black drop shadow
        var filter = defs.append("filter")
            .attr("id", "drop-shadow")
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 1)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 1)
            .attr("dy", 1)
            .attr("result", "offsetBlur");
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");


        //Bars
        svg.selectAll("myRect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", x(0))
            .attr("y", function (d) { return y(d.author); })
            .attr("width", function (d) { return x(d.commits); })
            .attr("height", y.bandwidth())
            .attr("fill", "#1f38b4")
            .attr("rx", "3px")
            .style("transition", "fill-opacity .4s ease")
            .on("mouseover", function (d) {
                d3.select(this)
                    //.attr("fill-opacity", ".8")
                    .style("filter", "url(#drop-shadow)");
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    //.attr("fill-opacity", "1")
                    .style("filter", "none");
            })
            .append("title")
            .text(function (d) { return d.commits; });


    });
}






function pie_chart() {

    var time = Date.now();
    var json_file = "/data/langs.json?u=" + time;
    d3.json(json_file, function (data) {

        var legendSpacing = 7; // defines spacing between squares
        var legend_radius = 4;

        // legend dimensions
        var width = 400
        height = 180
        margin = 20

        // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
        // var radius = 80
        if (regulatory_height > 180) regulatory_height = 90;
        else if (regulatory_height < 66) regulatory_height = 66;
        var radius = regulatory_height;

        /* d3.select("#pie_chart")
            .append("h2")
            .text("Language Breakdown") */

        var svg = d3.select("#pie_chart")
            .append("svg")
            .style("border-left", "1px solid black")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 3 + "," + radius + ")");


        // set the color scale
        var color = d3.scaleOrdinal()
            .domain(Object.keys(data))
            .range(d3.schemeDark2);

        // Compute the position of each group on the pie:
        var pie = d3.pie()
            .padAngle(0.01)
            .sort(null) // Do not sort group by size
            .value(function (d) { return d.value; })
        var data_ready = pie(d3.entries(data))

        // The arc generator
        var arc = d3.arc()
            .cornerRadius(2)
            .innerRadius(radius * 0)         // This is the size of the donut hole
            .outerRadius(radius * 0.8)

        // Another arc that won't be drawn. Just for labels positioning
        var outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9)

        var tooltip = d3.select('#pie_chart') // select element in the DOM with id 'chart'
            .append('div') // append a div element to the element we've selected                                    
            .attr('class', 'tooltip'); // add class 'tooltip' on the divs we just selected

        tooltip.append('div') // add divs to the tooltip defined above                            
            .attr('class', 'label'); // add class 'label' on the selection                         

        var defs = svg.append("defs");
        // black drop shadow
        var filter = defs.append("filter")
            .attr("id", "drop-shadow")
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 1)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 1)
            .attr("dy", 1)
            .attr("result", "offsetBlur");
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");


        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        svg
            .selectAll('allSlices')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', function (d) { return (color(d.data.key)) })
            //.attr("stroke", "#fffff5")
            //.style("stroke-width", "1px")
            .style("opacity", 0.8)
            .style("transition", "fill-opacity .4s ease")
            .on("mouseover", function (d) {
                d3.select(this)
                    .attr("fill-opacity", ".8")
                    .style("filter", "url(#drop-shadow)");
                //tooltip.select('.label').html(d.data.key);
                //tooltip.style('display', 'block');
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .attr("fill-opacity", "1")
                    .style("filter", "none");
                //tooltip.style('display', 'none');
            })
            .append("title")
            .text(function (d) { return d.data.key; });


        // define legend
        var legend = svg.selectAll('.legend') // selecting elements with class 'legend'
            .data(color.domain()) // refers to an array of labels from our dataset
            .enter() // creates placeholder
            .append('g') // replace placeholders with g elements
            .attr('class', 'legend') // each g is given a legend class
            .attr('transform', function (d, i) {
                var height = 15 + legendSpacing; // height of element is the height of the colored square plus the spacing      
                var offset = height * color.domain().length / 2; // vertical offset of the entire legend = height of a single element & half the total number of elements  
                var vert = i * height - offset; // the top of the element is hifted up or down from the center using the offset defiend earlier and the index of the current element 'i'               
                return 'translate(' + radius + ',' + vert + ')'; //return translation       
            });

        // adding colored squares to legend
        legend.append('circle') // append rectangle squares to legend                                   
            .attr("r", legend_radius)
            .style('fill', color) // each fill is passed a color
            .style('stroke', color) // each stroke is passed a color


        // adding text to legend
        legend.append('text')
            .attr('x', legend_radius + legendSpacing)
            .attr('y', 1 + (legend_radius / 2))
            .attr("font-size", "12px")
            .data(data_ready)
            .text(function (d) { return d.data.key + " - " + d.data.value + "%"; }); // return label

    });
}






/*  -- RENDER README -- */

function render_readme() {
    var div = d3.select("#data_display")
        .append("div")
        .attr("padding-top", "20px")
        .attr("id", "readme")
        .style("background", "#ffffff")
        .style("border-left", "1px solid black")
        .style("margin-left", "10%")
        .style("margin-right", "10%")
        .style("padding-left", "20px");

    d3.select("#data_display").select("#readme").append("h2").attr("class", "readme_title").text("README.md");

    var time = Date.now();
    var readme_html = "/data/readme.html?u=" + time;
    var rawFile = new XMLHttpRequest();

    rawFile.open("GET", readme_html, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                console.log(allText);
                document.getElementById("readme").innerHTML += allText;

            }
        }
    }
    rawFile.send(null);

}

function renderUserData() {


    var user_data = d3.select("body")
        .append("section")
        .attr("id", "user_data")
        .style("margin-left", "20%")
        .style("width", "40%")
        .style("padding-top","20px");

    //    avi.src = "/data/avatar.jpg";

    var user_avi_svg = d3.select("#user_data")
        .append("svg")
        .attr("id", "user_svg")
        .attr("height", "500")
        .style("padding-left", "5px");
        


    var avi_html = "/data/avatar.jpg?u=" + Date.now();

    // black drop shadow
    
    user_avi_svg.append("svg:image")
        .attr("id", "user_avi")
        .attr("xlink:href", avi_html)
        .attr("width", "256")
        .attr("height", "256")
        .attr("x", "5")
        .attr("y", "5");

}

/* --  Render github activity line graph  -- */

function render_commits_line_graph() {

}