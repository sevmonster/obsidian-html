var current_node_id = '';
var current_node_graph_id = '';
var Graph = null;

function run(uid, pinnedNode, pinnedNodeGraph)
{
    // set current node
    current_node_id = pinnedNode;
    current_node_graph_id = pinnedNodeGraph;

    // Get elements
    let _button = document.getElementById('B' + uid);
    let cont = document.getElementById('A'+uid);
    let data = get_graph_data();
    let node_graph_data = get_node_graph_data();

    // toggle graph on or off
    var turn_on = true;
    if (_button.innerHTML == 'Hide Graph'){
        turn_on = false;
        _button.innerHTML = 'Show Graph';
        cont.style.display = "None";
    }
    else {
        _button.innerHTML = "Hide Graph";
        cont.style.display = "block";
    }

    args = get_graph_args(uid)
    args.current_node_id = pinnedNode
    args.current_node_graph_id = pinnedNodeGraph

    grapher(args)
}

function get_graph_args(uid){
        let cont = document.getElementById('A'+uid);
        let data = get_graph_data();
        let node_graph_data = get_node_graph_data();

        let width = cont.clientWidth;
        let height = cont.clientHeight;        

        return {
                'graph_container': cont, 
                'width': width, 
                'height': height, 
                'current_node_id':null, 
                'current_node_graph_id': null,
                'data': data, 
                'node_graph_data': node_graph_data,
                'node': null, 
                'link': null
            }
}

function get_graph_data(){
        return '{html_url_prefix}/obs.html/data/graph.json';
}

function get_node_graph_data(){
        return '{html_url_prefix}/obs.html/data/node_graph.json';
}


function graph_left_click(args){
        return graph_open_link(args)
}

function graph_right_click(args){
        return function(){
            return false
        }
}

function graph_open_link(args){
    let url = args.node.url;
    if (! {no_tabs})
    {
        return function() {
            let level = parseInt(args.graph_container.parentElement.parentElement.level);
            httpGetAsync(encodeURI('/'+url), ReceiveCall, level+1, false); 
            return false;
        }
    }
    else {
        return function(){
            window.location.href = '{html_url_prefix}/'+url;
            //window.location.href = '/'+url;
            return false;
        }
    }
}

function graph_select_node(args){
        return function() {
            current_node_id = args.node.id;
            Graph.refresh();
            return false;
        }
}






function run_old(uid, pinnedNode){
    // Get elements
    var _button = document.getElementById('B' + uid);
    var _svg = document.getElementById('A' + uid);
    
    // toggle graph on or off
    var turn_on = true;
    if (_button.innerHTML == 'Hide Graph'){
        _button.innerHTML = 'Show Graph';
        turn_on = false;
        _svg.style.display = "None";
        d3.selectAll("#A" + uid + " > *").remove();
    }
    else {
        _button.innerHTML = "Hide Graph";
        _svg.style.display = "block";

        cont = _svg.parentElement;
        
        if (cont.getBoundingClientRect().right > window.visualViewport.width){
                window.scrollBy(cont.getBoundingClientRect().right - window.visualViewport.width,0)
        }
        
    }
    // run d3 graph

    if (turn_on){
        let positionInfo = _svg.getBoundingClientRect();
        var svg = d3.select("#A" + uid),
            width = +positionInfo.width,
            height = +positionInfo.height;
        console.log ('width: '+width);
        console.log ('height: '+height);

        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id; }))
            .force("charge", d3.forceManyBody().strength({graph_coalesce_force}))
            .force("center", d3.forceCenter(width / 2, height / 2))

        d3.json("{html_url_prefix}/obs.html/data/graph.json", function(error, graph) {
                if (error) throw error;


                //add encompassing group for the zoom 
                var g = svg.append("g")
                .attr("class", "everything");

                var link = g.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

                var node = g.append("g")
                .attr("class", "nodes")
                .selectAll("g")
                .data(graph.nodes)
                .enter().append("g")            

                var circles = node.append("circle")
                .attr("r", 5)
                .attr("fill", function(d) { 
                        if (d.id == pinnedNode){
                                return 'red'
                        }
                        return color(d.group); 
                });

                // Create a drag handler and append it to the node object instead
                var drag_handler = d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);

                drag_handler(node);
                
                var lables = node.append("text")
                .text(function(d) {
                        return d.id;
                })
                .attr('x', 6)
                .attr('y', 3)

                if (! {no_tabs})
                {
                        lables.on("click", function(d) {
                                let svg_el = document.getElementById('A' + uid);
                                let level = parseInt(svg_el.parentElement.parentElement.level);
                                httpGetAsync(encodeURI('/'+d.url), ReceiveCall, level+1, false); 
                                return false;
                        });
                }
                else {
                        lables.on("click", function(d) {
                                window.location.href = '{html_url_prefix}/'+d.url;
                                return false;
                        });
                }

                node.append("title")
                .text(function(d) { return d.id; });

                simulation
                .nodes(graph.nodes)
                .on("tick", ticked);

                simulation.force("link")
                .links(graph.links);

                function ticked() {
                        node
                                .attr("transform", function(d) { 
                                        if (d.id == pinnedNode){  
                                                d.fx = (width / 2)
                                                d.fy = (height / 2)  
                                        }                          
                                        return "translate(" + d.x + "," + d.y + ")";
                                })

                        // //constrains the nodes to be within a box
                        // node
                        //         .attr("cx", function(d) { return let dx = Math.max(d.radius, Math.min(width - d.radius, d.x)); })
                        //         .attr("cy", function(d) { return d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)); }); 
                        link
                                .attr("x1", function(d) { return d.source.x; })
                                .attr("y1", function(d) { return d.source.y; })
                                .attr("x2", function(d) { return d.target.x; })
                                .attr("y2", function(d) { return d.target.y; });
                }

        //add zoom capabilities 
        var zoom_handler = d3.zoom()
            .on("zoom", zoom_actions);

        zoom_handler(svg); 
                //Zoom functions 
                function zoom_actions(){
                        g.attr("transform", d3.event.transform)
                }
        });


        function dragstarted(d) {
                if (d.id == pinnedNode){
                        return
                }
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();         
                d.fx = d.x;
                d.fy = d.y;
        }

        function dragged(d) {
                if (d.id == pinnedNode){
                        return
                }                
                d.fx = d3.event.x;
                d.fy = d3.event.y;
        }

        function dragended(d) {
                if (d.id == pinnedNode){
                        return
                }
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
        }
    }
}
