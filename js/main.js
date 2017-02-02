

var username = "";
var followers;

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
      addDivWithHtml("error_info", "<h3>There has been an error</h3><p>"+err.message+"</p>");
      return;
    }
    // else
    removeLoadingDiv();
    addToElement("header_info", "<p>Number of followers: "+followers.length + (followersResult.max  ? " or more (fetch limit reached)" : "") +"</p>");
    if (followers.length > 0) {
      addToElement("header_info", "<p>TODO : more</p>");
      // TODO : more
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


function addDivWithHtml(id, html) {
  var container = window.document.getElementById('main_container');
  container.innerHTML += "<div class=\"jumbotron\" id=\""+id+"\">"+html+"</div>";
}

function addToElement(id, html) {
  var element = window.document.getElementById(id);
  if (element) {
    element.innerHTML += html;
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