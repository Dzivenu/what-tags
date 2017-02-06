
const
  FOLLOWERS_FETCH_LIMIT = 1000;

var
  NUM_POSTS_TO_SCRAPE = 10,
  NUM_TOP_TAGS_FOR_GRAPHING = 2;

var username = "";
var followers = [];
var followersTags = [];
var followersTagsTop5 = {};
var allTags = {};
var allTagsArray = [];
var tagsTop5 = {};
var tagsTop5ByUsers = {};

document.getElementById('input_username').onkeypress = function(e){
  if (!e) e = window.event;
  var keyCode = e.keyCode || e.which;
  if (keyCode == '13'){
    begin();
    return false;
  }
};

function begin() {
  var inputUsername = window.document.getElementById('input_username');
  var inputPostsToScrape = window.document.getElementById('input_posts_to_scrape');
  var inputNumTopTagsToGraph = window.document.getElementById('input_num_top_tags_to_graph');
  if (inputUsername) {
    username = inputUsername.value;
    if (username.length < 1) {
      return;
    }
    //NUM_POSTS_TO_SCRAPE
    if (inputPostsToScrape && inputPostsToScrape.value.length > 0) {
      NUM_POSTS_TO_SCRAPE = Number(inputPostsToScrape.value);
    }
    if (NUM_POSTS_TO_SCRAPE < 1) {
      addErrorDiv("<p>Posts to scrape cannot be less than 1!</p>");
    } else if (NUM_POSTS_TO_SCRAPE > 100) {
      addErrorDiv("<p>Posts to scrape cannot be more than 100!</p>");
    }
    //NUM_TOP_TAGS_FOR_GRAPHING
    if (inputNumTopTagsToGraph && inputNumTopTagsToGraph.value.length > 0) {
      NUM_TOP_TAGS_FOR_GRAPHING = Number(inputNumTopTagsToGraph.value);
    }
    if (NUM_TOP_TAGS_FOR_GRAPHING < 1) {
      addErrorDiv("<p>Num top tags to graph cannot be less than 1!</p>");
    } else if (NUM_TOP_TAGS_FOR_GRAPHING > 5) {
      addErrorDiv("<p>Num top tags to graph cannot be more than 100!</p>");
    }
    removeDiv('form_div');
    beginWithSpecifiedUser();
  }
}

function beginWithSpecifiedUser() {
  // clean username
  if (username[0].localeCompare('@') == 0) {
    username = username.substr(1, username.length - 1);
  }
  addDivWithHtml("header_info", "<h3>@"+username+"</h3>");
  addLoadingDiv("Fetching @"+username+"'s followers...");
  //steem.api.getDiscussionsByAuthorBeforeDate(username, startPermlink, beforeDate, limit, function(err, response) {
  followers = [];
  getFollowers(username, function(err, followersResult) {
    removeLoadingDiv();
    if (err || followersResult == null) {
      addErrorDiv("<h3>There has been an error</h3><p>"+err.message+"</p>");
      return;
    }
    // else
    addToElement("header_info", "<p>Number of followers: "+followers.length + (followersResult.max  ? " or more (fetch limit of "+FOLLOWERS_FETCH_LIMIT+" reached)" : "") +"</p>");
    if (followers.length > 0) {
      addLoadingDiv("Scrapping tags from up to last "+NUM_POSTS_TO_SCRAPE+" posts of followers, this can take a while...");
      // get each followers tags
      followersTags = [];
      addToElement("header_info", "<p id=\"p_followers\">Followers processed so far: 0</p>");
      getFollowersTags_recursive(0, function (err, getFollowersTagsResult) {
        removeLoadingDiv();
        if (err || getFollowersTagsResult == null) {
          addErrorDiv("<p>Error getting tags from user: "+followers[index]+"</p>"
            +"<p>Processed stopped, please submit a bug report to the <a href=\"https://github.com/Steem-FOSSbot/what-tags/issues\">What Tag issue tracker</a></p>"
            +(err ? "<p>with the following error:</p><p>"+err.message+"</p>" : ""));
          return;
        }
        addLoadingDiv("Analysing statistics...");
        // generate stats
        console.log("generateAllTags");
        generateAllTags();
        console.log("generateAllTop5Tags");
        generateAllTop5Tags();
        console.log("generateAllTop5TagsByUsers");
        generateAllTop5TagsByUsers();
        console.log("generateFollowersTop5");
        generateFollowersTop5();
        // finish
        removeLoadingDiv();
        addToElement("header_info", "<p>Done, analysis complete.</p>");
        console.log("createGraphs");
        createGraphs();
        console.log("DONE");
      });
    } else {
      addErrorDiv("<p>No followers!</p>");
    }
  });
}

function generateFollowersTop5() {
  followersTagsTop5 = {};
  for (var userTags in followersTags) {
    followersTagsTop5[followersTags[userTags].username] = generateTop5(followersTags[userTags].tags);
  }
  //console.log("followersTagsTop5 = "+JSON.stringify(followersTagsTop5));
}

function generateAllTop5Tags() {
  if (allTags == null) {
    return;
  }
  var orderedTop5TagNames = [null, null, null, null, null];
  var orderedTop5TagValues = [0, 0, 0, 0, 0];
  for (var tag in allTags) {
    for (var i = 0 ; i < 5 ; i++) {
      if (allTags[tag].freq > orderedTop5TagValues[i]) {
        // shuffle down
        for (var j = 4 ; j > i ; j--) {
          orderedTop5TagNames[j] = orderedTop5TagNames[j-1];
          orderedTop5TagValues[j] = orderedTop5TagValues[j-1];
        }
        orderedTop5TagNames[i] = tag;
        orderedTop5TagValues[i] = allTags[tag].freq;
        break;
      }
    }
  }
  tagsTop5 = {
    tags: orderedTop5TagNames,
    freqs: orderedTop5TagValues
  };
  //console.log("top 5 tags: "+JSON.stringify(tagsTop5));
}

function generateAllTop5TagsByUsers() {
  if (allTags == null) {
    return;
  }
  var orderedTop5TagNames = [null, null, null, null, null];
  var orderedTop5TagValues = [0, 0, 0, 0, 0];
  for (var tag in allTags) {
    for (var i = 0 ; i < 5 ; i++) {
      if (allTags[tag].usernames.length > orderedTop5TagValues[i]) {
        // shuffle down
        for (var j = 4 ; j > i ; j--) {
          orderedTop5TagNames[j] = orderedTop5TagNames[j-1];
          orderedTop5TagValues[j] = orderedTop5TagValues[j-1];
        }
        orderedTop5TagNames[i] = tag;
        orderedTop5TagValues[i] = allTags[tag].usernames.length;
        break;
      }
    }
  }
  tagsTop5ByUsers = {
    tags: orderedTop5TagNames,
    num_users: orderedTop5TagValues
  };
  //console.log("top 5 tags: "+JSON.stringify(tagsTop5));
}

function generateTop5(tags) {
  if (tags == null) {
    return;
  }
  var orderedTop5TagNames = [null, null, null, null, null];
  var orderedTop5TagValues = [0, 0, 0, 0, 0];
  for (var tag in tags) {
    for (var i = 0 ; i < 5 ; i++) {
      if (tags[tag] > orderedTop5TagValues[i]) {
        // shuffle down
        for (var j = 4 ; j > i ; j--) {
          orderedTop5TagNames[j] = orderedTop5TagNames[j-1];
          orderedTop5TagValues[j] = orderedTop5TagValues[j-1];
        }
        orderedTop5TagNames[i] = tag;
        orderedTop5TagValues[i] = tags[tag];
        break;
      }
    }
  }
  var top5 = {
    tags: orderedTop5TagNames,
    freqs: orderedTop5TagValues
  };
  return top5;
}

function generateAllTags() {
  allTags = {};
  for (var userTags in followersTags) {
    for (var tag in followersTags[userTags].tags) {
      if (allTags.hasOwnProperty(tag)) {
        allTags[tag].freq += followersTags[userTags].tags[tag];
        allTags[tag].usernames.push(followersTags[userTags].username);
      } else {
        allTags[tag] = {
          freq: followersTags[userTags].tags[tag],
          usernames: [followersTags[userTags].username]
        };
      }
    }
  }
  //console.log(JSON.stringify(allTags));
  allTagsArray = [];
  for (var tag in allTags) {
    allTagsArray.push({name: tag, freq: allTags[tag].freq, usernames: allTags[tag].usernames});
  }
}

function getFollowersTags_recursive(index, callback) {
  if (followers == null || followers.length < 1) {
    callback({message: "no followers"}, null);
    return;
  }
  getTagsUsedByUser(followers[index], function(err, tagsResult) {
    if (err || tagsResult == null) {
      callback({message: "follower ["+followers[index]+"]: "+err.message}, null);
      return;
    }
    followersTags.push({
      username: followers[index],
      tags: tagsResult
    });
    if ((index + 1) >= followers.length) {
      modifyElement("p_followers", "Followers processed so far: "+followers.length);
      callback(null, true);
    } else {
      getFollowersTags_recursive(index + 1, callback);
    }
    modifyElement("p_followers", "Followers processed so far: "+(index+1));
  });
}

function getFollowers(username, callback) {
  steem.api.getFollowers(username, 0, null, FOLLOWERS_FETCH_LIMIT, function(err, followersResult) {
    if (err || followersResult == null) {
      callback({message: "error: "+(err != null ? err.message + ", " + JSON.stringify(err.payload) : "null result")}, null);
    }
    for (var i = 0 ; i < followersResult.length ; i++) {
      if (followersResult[i].what.indexOf('blog') >= 0) {
        followers.push(followersResult[i].follower);
      }
    }
    callback(null, {max: followersResult.length == FOLLOWERS_FETCH_LIMIT});
  });
}

function getTagsUsedByUser(username, callback) {
  steem.api.getDiscussionsByAuthorBeforeDate(username, null, (new Date()).toISOString().slice(0, 19), NUM_POSTS_TO_SCRAPE, function(err, authorDiscussionsResponse) {
    if (err || authorDiscussionsResponse == null) {
      callback({message: "error: "+(err != null ? err.message + ", " + JSON.stringify(err.payload) : "null result")}, null);
    }
    //console.log("getDiscussionsByAuthorBeforeDate: "+username+" = "+JSON.stringify(authorDiscussionsResponse));
    var tags = {};
    for (var i = 0 ; i < authorDiscussionsResponse.length ; i++) {
      if (authorDiscussionsResponse[i].hasOwnProperty("json_metadata")) {
        try {
          var metadata = JSON.parse(authorDiscussionsResponse[i].json_metadata);
          for (var j = 0; j < metadata.tags.length; j++) {
            if (tags.hasOwnProperty(metadata.tags[j])) {
              tags[metadata.tags[j]]++;
            } else {
              tags[metadata.tags[j]] = 1;
            }
          }
        } catch(err) {
          // allow to catch parse non-fatally
          console.log("error parsing metadata for user "+username+", post "+authorDiscussionsResponse[i].permlink);
        }
      }
    }
    callback(null, tags);
  });
}

// -- GRAPHING

function createGraphs() {
  console.log("createTop5Graph");
  //createTop5Graph();
  console.log("createTopCharts");
  createTopCharts();
  console.log("createAllTagsGraph");
  createAllTagsGraph();
  console.log("createAllAuthorsGraph");
  //createAllAuthorsGraph();
}

function createTop5Graph() {
  var html_text = "<h3>Top 5 tags</h3>";
  html_text += "<br/><h4>By overall usage</h4>";
  for (var i = 0 ; i < 5 ; i++) {
    html_text += "<p><strong>" + tagsTop5.tags[i] + "</strong> used " + tagsTop5.freqs[i] + " times</p>";
  }
  html_text += "<br/><h4>By number of users using</h4>";
  for (var i = 0 ; i < 5 ; i++) {
    html_text += "<p><strong>" + tagsTop5ByUsers.tags[i] + "</strong> used by " + tagsTop5ByUsers.num_users[i] + " users</p>";
  }
  addDivWithHtml("top_5_tags_text", html_text);
}

// modified from example at https://bl.ocks.org/mbostock/4063269
//    fixed by http://stackoverflow.com/a/39377170/781729
//    and https://jsfiddle.net/r24e8xd7/9/
function createAllTagsGraph() {
  var dataset = {children: allTagsArray};
  addDivWithHtml("all_tags_graph", "<h3>Total tag usage / users using</h3>"
    + "<p>Size indicates tag usage in total</p>"
    + "<p>Color indicates tag usage by users (bluer = more users use tag)</p>", "chart1");

  var maxUsersForSingleTag = 0;
  for (var i = 0 ; i < allTagsArray.length ; i++) {
    if (allTagsArray[i].usernames.length > maxUsersForSingleTag) {
      maxUsersForSingleTag = allTagsArray[i].usernames.length;
    }
  }

  var diameter = 800; //max size of the bubblesv
  //var color    = d3.scaleOrdinal(d3.schemeCategory20c); //color category
  var color = d3.scaleLinear()
    .domain([1, maxUsersForSingleTag])
    .range(["pink", "steelblue"]);

  var bubble = d3.pack(dataset)
    .size([diameter, diameter])
    .padding(1.5);

  var svg = d3.select(".chart1")
    .append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

  //bubbles needs very specific format, convert data to this.
  var nodes = d3.hierarchy(dataset)
    .sum(function(d) { return d.freq; });

  var node = svg.selectAll(".node")
    .data(bubble(nodes).descendants())
    .enter()
    .filter(function(d){
      return  !d.children
    })
    .append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  node.append("title")
    .text(function(d) {
      return "tag \"" + d.data.name + "\" used " + d.data.freq + " times by " + d.data.usernames.length + " users";
    });

  node.append("circle")
    .attr("r", function(d) {
      return d.r;
    })
    .style("fill", function(d) {
      return color(d.data.usernames.length);
    });

  node.append("text")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
    .text(function(d) {
      return d.r > 30 ? d.data.name : ""; // + ": " + d.data.freq
    });

  d3.select(self.frameElement)
    .style("height", diameter + "px");
}

function createTopCharts() {
  // tags by freq
  addDivWithHtml("all_tags_graph", "<h3>Frequency of total usage of tags</h3>"
    + "<h4>Top 50</h4>"
    , "chart3");
  var allTagsArrayByFreq = allTagsArray.sort(function(a, b){ return d3.descending(a.freq, b.freq); });
  var allTagsArrayByFreqTop = [];
  for (var i = 0 ; i < 50 && i < allTagsArrayByFreq.length ; i++) {
    allTagsArrayByFreqTop.push(allTagsArrayByFreq[i]);
  }
  createBarChart(allTagsArrayByFreqTop, "chart3", function(d) {return d.freq});

  // tags by users
  addDivWithHtml("all_tags_graph", "<h3>Number of users using tags</h3>"
    + "<h4>Top 50</h4>"
    , "chart4");
  var allTagsArrayByUsr = allTagsArray.sort(function(a, b){ return d3.descending(a.usernames.length, b.usernames.length); });
  var allTagsArrayByUsrTop = [];
  for (var i = 0 ; i < 50 && i < allTagsArrayByUsr.length ; i++) {
    allTagsArrayByUsrTop.push(allTagsArrayByUsr[i]);
  }
  createBarChart(allTagsArrayByUsrTop, "chart4", function(d) {return d.usernames.length});
}


// modified from https://gist.github.com/d3noob/8952219
function createBarChart(data, chartId, getValue) {
  var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = 900 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;
  var x = d3.scaleBand().range([0, width]).padding(.05);
  var y = d3.scaleLinear().range([height, 0]);
  var xAxis = d3.axisBottom()
    .scale(x);
  var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(10);
  var svg = d3.select("."+chartId)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return getValue(d); })]);
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", "-.55em")
    .attr("transform", "rotate(-90)" );
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Value ($)");
  svg.selectAll("bar")
    .data(data)
    .enter().append("rect")
    .style("fill", "steelblue")
    .attr("x", function(d) { return x(d.name); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(getValue(d)); })
    .attr("height", function(d) { return height - y(getValue(d)); });
}

// modified from example at https://bl.ocks.org/mbostock/4062045
function createAllAuthorsGraph() {
  addDivWithHtml("all_authors_top_tag_graph", "<h3>Authors using same top tag</h3>"
    + "<p>Shows connections between authors who use at least one of the same of their top "+NUM_TOP_TAGS_FOR_GRAPHING+" most used tags</p>"
    + "<p>Not shown are authors who are off on their own don't share any top "+NUM_TOP_TAGS_FOR_GRAPHING+" tags with the other followers</p>"
    + "<br/><p>Mouse over a dot for information about that author. You can also drag dots.</p>"
    , "chart2");

  var width = 1000,
    height = 800;

  var svg = d3.select(".chart2")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  //allTagsArray.push({name: tag, freq: allTags[tag].freq, usernames: allTags[tag].usernames});

  var createNodes = function(_links) {
    var _nodes = [];
    for (var i = 0 ; i < followers.length ; i++) {
      var linked = false;
      for (var j = 0 ; j < _links.length ; j++) {
        if (_links[j].source.localeCompare(followers[i]) == 0
            || _links[j].target.localeCompare(followers[i]) == 0) {
          linked = true;
        }
      }
      if (linked) {
        _nodes.push({
          id: followers[i],
          group: 1
        });
      }
    }
    return _nodes;
  };

  var maxLinkSources = 0;

  var createLinksTopTagOnly = function() {
    var _links = [];
    //console.log("createLinks");
    for (var usr1 in followersTagsTop5) {
      //console.log(" - usr1: "+usr1);
      var topTag1 = "";
      var topTag1Freq = 0;
      for(var tag1 in followersTagsTop5[usr1]) {
        if (followersTagsTop5[usr1][tag1] > topTag1Freq) {
          topTag1Freq = followersTagsTop5[usr1][tag1];
          topTag1 = tag1;
        }
      }
      //console.log(" - - tag1 "+(c++)+": "+tag1);
      for (var usr2 in followersTagsTop5) {
        //console.log(" - - - usr2: "+usr2);
        if (usr1.localeCompare(usr2) != 0) {
          var topTag2 = "";
          var topTag2Freq = 0;
          for (var tag2 in followersTagsTop5[usr2]) {
            if (followersTagsTop5[usr2][tag2] > topTag2Freq) {
              topTag2Freq = followersTagsTop5[usr2][tag2];
              topTag2 = tag2;
            }
          }
          //console.log(" - - - - tag2: "+tag2);
          if (topTag1.localeCompare(topTag2) == 0) {
            //console.log(" - - - - - MATCH!");

            var existingLinkIdx = -1;
            for (var k = 0 ; k < _links.length ; k++) {
              if ((_links[k].source.localeCompare(usr1) == 0 && _links[k].target.localeCompare(usr2) == 0)
              //  || (_links[k].source.localeCompare(usr2) == 0 && _links[k].target.localeCompare(usr1) == 0)
              ) {
                existingLinkIdx = k;
                break;
              }
            }
            if (existingLinkIdx >= 0) {
              _links[existingLinkIdx].value++;
            } else {
              _links.push({
                source: usr1,
                target: usr2,
                value: 1
              });
            }
            break;
          }
        }
      }
    }
    return _links;
  };

  var createLinksTopTags = function() {
    var _links = [];
    //console.log("createLinks");
    for (var usr1 in followersTagsTop5) {
      //console.log(" - usr1: "+usr1);
      for(var i = 0 ; i < NUM_TOP_TAGS_FOR_GRAPHING ; i++) {
        var tag1 = followersTagsTop5[usr1].tags[i];
        if (tag1 && tag1.localeCompare("null") != 0) {
          //console.log(" - - tag1 "+(c++)+": "+tag1);
          for (var usr2 in followersTagsTop5) {
            //console.log(" - - - usr2: "+usr2);
            if (usr1.localeCompare(usr2) != 0) {
              for(var j = 0 ; j < NUM_TOP_TAGS_FOR_GRAPHING ; j++) {
                var tag2 = followersTagsTop5[usr2].tags[j];
                if (tag2 && tag2.localeCompare("null") != 0) {
                  //console.log(" - - - - tag2: "+tag2);
                  if (tag1.localeCompare(tag2) == 0) {
                    //console.log(" - - - - - MATCH!");
                    var existingLinkIdx = -1;
                    for (var k = 0 ; k < _links.length ; k++) {
                      if ((_links[k].source.localeCompare(usr1) == 0 && _links[k].target.localeCompare(usr2) == 0)
                        || (_links[k].source.localeCompare(usr2) == 0 && _links[k].target.localeCompare(usr1) == 0)) {
                        existingLinkIdx = k;
                        break;
                      }
                    }
                    if (existingLinkIdx >= 0) {
                      _links[existingLinkIdx].value++;
                    } else {
                      _links.push({
                        source: usr1,
                        target: usr2,
                        value: 1
                      });
                    }
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
    return _links;
  };

  var links = createLinksTopTags(); //createLinksTopTagOnly();
  var nodes = createNodes(links);

  var graph = {
    nodes: nodes,
    links: links
  };

  //console.log("graph = "+JSON.stringify(graph));

  for (var i = 0 ; i < graph.links.length ; i++) {
    if (graph.links[i].value > maxLinkSources) {
      maxLinkSources = graph.links[i].value;
    }
  }

  var colorLinks = d3.scaleLinear()
    .domain([1, maxLinkSources])
    .range(["#D9D9D9", "steelblue"]);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-100).distanceMax(300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  //graph is object
  var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .attr("stroke", function(d) { return colorLinks(d.value); }) //Math.sqrt(d.value)
    .attr("stroke-width", function(d) { return 1; }); //Math.sqrt(d.value)   Math.pow(d.value, 2)

  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", 5)
    .attr("fill", function(d) { return d.group == 1 ? "orange" : "yellow"; })
      .attr("stroke", function(d) { return "gray"; })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
      ;

  node.append("title")
    .text(function(d) {
      var str = "";
      for (var i = 0 ; i < NUM_TOP_TAGS_FOR_GRAPHING ; i++) {
        str += followersTagsTop5[d.id].tags[i] + (i != (NUM_TOP_TAGS_FOR_GRAPHING - 1) ? ", " : "");
      }
      return d.id + " using top "+NUM_TOP_TAGS_FOR_GRAPHING+" tags " + str;
    });

  node.append("title")
    .text(function(d) { return d.id; });

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);

  function ticked() {
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// -- UTILS

function addDivWithHtml(id, html, _class) {
  var container = window.document.getElementById('main_container');
  container.innerHTML += "<div class=\"jumbotron"+(_class != null ? " "+_class : "")+"\" id=\""+id+"\">"+html+"</div>";
}

function addToElement(id, html) {
  var element = window.document.getElementById(id);
  if (element) {
    element.innerHTML += html;
  } else {
    // if no existing element, add new one
    addDivWithHtml(id, html);
  }
}

function modifyElement(id, html) {
  var element = window.document.getElementById(id);
  if (element) {
    element.innerHTML = html;
  }
  // else nothing
}

function addLoadingDiv(title) {
  var container = window.document.getElementById('main_container');
  container.innerHTML +=  "<div class=\"jumbotron jumbotron_blue\" id=\"loading_div\"><p>"+title+"</p><div class=\"loader-inner ball-grid-pulse\"><div></div>"
    +"<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><br/><br/><br/></div></div>";
}

function addErrorDiv(html) {
  var container = window.document.getElementById('main_container');
  container.innerHTML += "<div class=\"jumbotron jumbotron_red\" id=\"error_div\">"+html+"</div>";
}

function removeDiv(id) {
  if (document.getElementById(id)) {
    document.getElementById(id).remove();
  }
}

function removeLoadingDiv() {
  removeDiv('loading_div');
}