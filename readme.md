# What Tags

A simple web app to show what tags a user uses, and the tags their followers use.

Requested by [(at)hexdek16](https://steemit.com/steemit/@hexdek16) on Steemit in [this post](https://steemit.com/steemit/@hexdek16/request-for-a-new-app-program-for-steemit).

> Could someone create an app that lets you know the tags your followers use or view. In creating content here on Steemit, I'd like to think followers follow me because they want to see content I create or Resteem. Yet, as more and more people follow me I'm unable to know what content my followers follow.

The project repository was started by @thrize AKA (at)personz on Steemit.

### There's nothing here yet!

That's right, the project is currently in **ideation**, no code has been written yet.

Please add suggestions, etc., as issues.

## Proposal

Create a frontend only, single webpage app to fetch user data from the Steem network, and analyse the tags used by a specified user's folloers.

Analysis can include:

- For all tags / top 5 tags (switchable)
  - Total tag usage by network
  - Who uses the same tags as each other, and most importantly with the specified user
  - Who has the most tags in common

### Libraries

- steem.js local copy usage
- Bootstrap for easy webpage creation
- jQuery, a dependency of Bootstrap, but use local non-CDN version
- D3js and maybe C3js for charts
- Loading animations from [loading.css](https://github.com/ConnorAtherton/loaders.css)

Note there doesn't need to be any login for this, just type in a username

### Charting and graphs

#### Frequency of all tags used

Graphing:

- [hierarchical bar chart](https://bl.ocks.org/mbostock/1283663)
- [bubble chart](https://bl.ocks.org/mbostock/4063269)

#### Relationships between authors

Graphing:

- [chord diagram](https://bl.ocks.org/mbostock/1046712)
- [hierarchical edge building](https://bl.ocks.org/mbostock/1044242)
- [zoomable circle packing](https://bl.ocks.org/mbostock/7607535)

#### More complex charting idea

Take the top 5 tags from every user that you follow, as well as the main user. Make relationships between users using these top 5

Graphing:

- [force directed graph](https://bl.ocks.org/mbostock/4062045)
- [radial tidy tree](https://bl.ocks.org/mbostock/4063550)