# What Tags

A simple web app to show what tags the followers of a particular user uses.

Requested by [(at)hexdek16](https://steemit.com/steemit/@hexdek16) on Steemit in [this post](https://steemit.com/steemit/@hexdek16/request-for-a-new-app-program-for-steemit).

> Could someone create an app that lets you know the tags your followers use or view. In creating content here on Steemit, I'd like to think followers follow me because they want to see content I create or Resteem. Yet, as more and more people follow me I'm unable to know what content my followers follow.

The project repository was started by @thrize AKA (at)personz on Steemit.

## Usage

This is a standalone single web page app. Simply enter in a Steemit username and start the analysis.

After posts of the specified user's followers have been scraped of tags, results are displayed.

These are arranged by total tag usage, and number of users using tags. They appear separately as bar charts and then combined as a bubble chart in radial projection.
 
## Future work

1. Analysis of who uses the same tags as each other, and most importantly with the specified user
2. Experimental graphing using a [force directed graph](https://bl.ocks.org/mbostock/4062045) (some work already begun in develop branch)

## Licenses and acknowledgements

### Libraries used

All libraries as local copy

- [steemit javascript](https://github.com/steemit/javascript), AKA steem.js (not yet used), - MIT license, license file missing from repo
- [Bootstrap](http://getbootstrap.com/) for easy webpage creation
- [jQuery](https://github.com/jquery/jquery), as Bootstrap dependency
- [D3js](https://github.com/d3/d3) for charts (not yet used)
- [loading.css](https://github.com/ConnorAtherton/loaders.css) for loading animations

### License

This project is [licensed](/LICENSE) under the Creative Commons CC0 1.0 Universal, which applies to all original programming.

This means it is free to use, copy and distribute, without restriction.