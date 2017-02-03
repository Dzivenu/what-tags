
const
  NUM_POSTS_TO_SCRAPE = 50;

var username = "";
var followers = [];
var followersTags = [];
var followersTagsTop5 = {};
var allTags = {};
var tagsTop5 = {};

function begin() {
  var inputUsername = window.document.getElementById('input_username');
  if (inputUsername) {
    username = inputUsername.value;
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
      addToElement("error_info", "<h3>There has been an error</h3><p>"+err.message+"</p>");
      return;
    }
    // else
    addLoadingDiv("Scrapping tags from up to last "+NUM_POSTS_TO_SCRAPE+" posts of followers, this can take a while...");
    addToElement("header_info", "<p>Number of followers: "+followers.length + (followersResult.max  ? " or more (fetch limit reached)" : "") +"</p>");
    if (followers.length > 0) {
      // get each followers tags
      followersTags = [];
      addToElement("header_info", "<p id=\"p_followers\">Followers processed so far: 0</p>");
      getFollowersTags_recursive(0, function (err, getFollowersTagsResult) {
        removeLoadingDiv();
        if (err || getFollowersTagsResult == null) {
          addToElement("error_info", "<p>Error getting tags from user: "+followers[index]+"</p>"
            +"<p>Processed stopped, please submit a bug report to the <a href=\"https://github.com/Steem-FOSSbot/what-tags/issues\">What Tag issue tracker</a></p>"
            +(err ? "<p>with the following error:</p><p>"+err.message+"</p>" : ""));
          return;
        }
        addToElement("header_info", "<p>Almost there!</p>");
        addLoadingDiv("Analysing statistics...");
        // generate stats
        generateAllTags();
        tagsTop5 = generateTop5(allTags);
        generateFollowersTop5();
        // finish
        removeLoadingDiv();
        addToElement("header_info", "<p>Done, analysis complete.</p>");
      });
    }
  });
}

function generateFollowersTop5() {
  followersTagsTop5 = {};
  for (var userTags in followersTags) {
    followersTagsTop5[followersTags[userTags].username] = generateTop5(followersTags[userTags].tags);
  }
  console.log(JSON.stringify(followersTagsTop5));
}

function generateTop5(tags) {
  if (tags == null) {
    return;
  }
  orderedTop5TagNames = [null, null, null, null, null];
  orderedTop5TagValues = [0, 0, 0, 0, 0];
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
        allTags[tag] += followersTags[userTags].tags[tag];
      } else {
        allTags[tag] = followersTags[userTags].tags[tag];
      }
    }
  }
  console.log(JSON.stringify(allTags));
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


// -- UTILS

function addDivWithHtml(id, html) {
  var container = window.document.getElementById('main_container');
  container.innerHTML += "<div class=\"jumbotron\" id=\""+id+"\">"+html+"</div>";
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
  container.innerHTML +=  "<div class=\"jumbotron jumbotron_col\" id=\"loading_div\"><p>"+title+"</p><div class=\"loader-inner ball-grid-pulse\"><div></div>"
    +"<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><br/><br/><br/></div></div>";
}

function removeLoadingDiv() {
  if (document.getElementById('loading_div')) {
    document.getElementById('loading_div').remove();
  }
}