

var username = "";
var followers = [];
var followersTags = [];

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
    if (err || followersResult == null) {
      removeLoadingDiv();
      addToDiv("error_info", "<h3>There has been an error</h3><p>"+err.message+"</p>");
      return;
    }
    // else
    addToDiv("header_info", "<p>Number of followers: "+followers.length + (followersResult.max  ? " or more (fetch limit reached)" : "") +"</p>");
    if (followers.length > 0) {
      //addToDiv("header_info", "<p>TODO : more</p>");
      // get each followers tags
      //for (var i = 0 ; i < followers.length ; i++) {
      var i = 0;
        getTagsUsedByUser(followers[i], function(err, tags) {
          if (err || tags == null) {
            removeLoadingDiv();
            addToDiv("error_info", "<p>Error getting tags from user: "+followers[i]+"</p>"
              +"<p>Processed stopped, please submit a bug report to the <a href=\"https://github.com/Steem-FOSSbot/what-tags/issues\">What Tag issue tracker</a></p>"
              +(err ? "<p>with the following error:</p><p>"+err.message+"</p>" : ""));
            return;
          }
          removeLoadingDiv();
          addToDiv("header_info", "<p>Test: got tags for first follower, "+followers[i]+", numbering "+tags.length+"</p>");
          var html_tags = "<h3>Tags</h3>";
          for (var key in tags) {
            html_tags += "<p>"+key+": "+tags[key]+"</p>";
          }
          addToDiv("test_tags_info", html_tags);
        });
      //}
    }
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
  steem.api.getDiscussionsByAuthorBeforeDate(username, null, (new Date()).toISOString().slice(0, 19), 10, function(err, authorDiscussionsResponse) {
    if (err || authorDiscussionsResponse == null) {
      callback({message: "error: "+(err != null ? err.message + ", " + JSON.stringify(err.payload) : "null result")}, null);
    }
    //console.log("getDiscussionsByAuthorBeforeDate: "+username+" = "+JSON.stringify(authorDiscussionsResponse));
    var tags = {};
    console.log("reading tags from "+authorDiscussionsResponse.length+" posts");
    for (var i = 0 ; i < authorDiscussionsResponse.length ; i++) {
      if (authorDiscussionsResponse[i].hasOwnProperty("json_metadata")) {
        var metadata = JSON.parse(authorDiscussionsResponse[i].json_metadata);
        console.log(" - - num tags is "+metadata.tags.length);
        for (var j = 0 ; j < metadata.tags.length ; j++) {
          console.log(" - - - tag: "+metadata.tags[j]);
          if (tags.hasOwnProperty(metadata.tags[j])) {
            tags[metadata.tags[j]]++;
            console.log(" - - - added, now "+tags[metadata.tags[j]]);
          } else {
            tags[metadata.tags[j]] = 1;
            console.log(" - - - new, 1");
          }
        }
      } else {
        console.log(" - post has no metadata!");
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

function addToDiv(id, html) {
  var element = window.document.getElementById(id);
  if (element) {
    element.innerHTML += html;
  } else {
    // if no existing element, add new one
    addDivWithHtml(id, html);
  }
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