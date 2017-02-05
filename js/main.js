
var
  NUM_POSTS_TO_SCRAPE = 10;

var username = "";
var followers = [];
var followersTags = [];
var followersTagsTop5 = {};
var allTags = {};
var allTagsArray = [];
var tagsTop5 = {};

function begin() {
  var inputUsername = window.document.getElementById('input_username');
  var inputPostsToScrape = window.document.getElementById('input_posts_to_scrape');
  if (inputUsername) {
    username = inputUsername.value;
    if (inputPostsToScrape && inputPostsToScrape.value.length > 0) {
      NUM_POSTS_TO_SCRAPE = Number(inputPostsToScrape.value);
    }
    if (NUM_POSTS_TO_SCRAPE < 1) {
      addErrorDiv("<p>Posts to scrape cannot be less than 1!</p>");
    } else if (NUM_POSTS_TO_SCRAPE > 100) {
      addErrorDiv("<p>Posts to scrape cannot be more than 100!</p>");
    }
    removeDiv('form_div');
    beginWithSpecifiedUser();
  }
}

function beginWithSpecifiedUser() {
  // clean username
  if (username == null || username.length < 1) {
    alert('username error!');
  }
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
    addToElement("header_info", "<p>Number of followers: "+followers.length + (followersResult.max  ? " or more (fetch limit reached)" : "") +"</p>");
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
        addToElement("header_info", "<p>Almost there!</p>");
        addLoadingDiv("Analysing statistics...");
        // generate stats
        generateAllTags();
        generateAllTop5Tags();
        generateFollowersTop5();
        // finish
        removeLoadingDiv();
        addToElement("header_info", "<p>Done, analysis complete.</p>");
        createGraphs();
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
  tagsTop5 = {};
  for (var i = 0 ; i < 5 ; i++) {
    tagsTop5[orderedTop5TagNames[i]] = orderedTop5TagValues[i];
  }
  console.log("top 5 tags: "+JSON.stringify(tagsTop5));
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
  var top5 = {};
  for (var i = 0 ; i < 5 ; i++) {
    top5[orderedTop5TagNames[i]] = orderedTop5TagValues[i];
  }
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
      callback(null, true);
    } else {
      getFollowersTags_recursive(index + 1, callback);
    }
    modifyElement("p_followers", "Followers processed so far: "+(index+1));
  });
}

function getFollowers(username, callback) {
  steem.api.getFollowers(username, 0, null, 1000, function(err, followersResult) {
    if (err || followersResult == null) {
      callback({message: "error: "+(err != null ? err.message + ", " + JSON.stringify(err.payload) : "null result")}, null);
    }
    for (var i = 0 ; i < followersResult.length ; i++) {
      if (followersResult[i].what.indexOf('blog') >= 0) {
        followers.push(followersResult[i].follower);
      }
    }
    callback(null, {max: followersResult.length == 1000});
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
  createTop5Graph();
  createAllTagsGraph();
}

function createTop5Graph() {
  var html_text = "<h3>Top 5 tags</h3><br/>";
  for (var tag in tagsTop5) {
    html_text += "<p><strong>" + tag + "</strong> used " + tagsTop5[tag] + " times</p>";
  }
  addDivWithHtml("top_5_tags_text", html_text);
}

// modified from example at https://bl.ocks.org/mbostock/4063269
//    fixed by http://stackoverflow.com/a/39377170/781729
//    and https://jsfiddle.net/r24e8xd7/9/
function createAllTagsGraph() {
  var dataset = {children: allTagsArray};
  addDivWithHtml("all_tags_graph", "<h3>Total tag usage</h3>"
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