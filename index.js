const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 5000;
const path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var { Octokit } = require('@octokit/rest');
const { v4: uuidv4 } = require('uuid');

const _ = require('lodash');

const get = async () => {
  const u =
    'https://3b439zgym3-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%20(lite)&x-algolia-application-id=3B439ZGYM3&x-algolia-api-key=14a0c8d17665d52e61167cc1b2ae9ff1';
  let hs = await get2();
  for (let i = 0; i < _.size(cf); i++) {
    const b = cf[i];
    const r = await axios.post(u, b);
    const h = _.get(r, 'results.0.hits');
    hs = hs.concat(h);
  }
  hs = _.filter(hs, (i) => i != null && i != undefined);
  hs = _.map(hs, (i, index) => {
    const resources = _.map(i.resources, 'link') || [];
    let i2 = { ...i };
    i2.assets = _.join(i2.assets, ',');
    i2.resources = resources;
    let dt1 = '';
    if (i.eventDate != null) {
      const dt = new Date(i.eventDate * 1000);
      i2.eventDate = dt;
      dt1 = dt1 + ` ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
    }
    if (i.updateDate != null) {
      const dt = new Date(i.updateDate * 1000);
      i2.updateDate = dt;
      dt1 = dt1 + ` ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
    }
    i2.date = dt1;
    return i2;
  });

  hs.sort(function (a1, b1) {
    return b1.updateDate - a1.updateDate;
  });

  const res = [];
  const ids = [];
  for (let i = 0; i < _.size(hs); i++) {
    const it = hs[i];
    const id = it.objectID;
    if (!_.includes(ids, id)) {
      res.push(it);
      ids.push(id);
    }
  }
  return Promise.resolve(res);
};

const get2 = async () => {
  const u =
    'https://3b439zgym3-2.algolianet.com/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%20(lite)&x-algolia-application-id=3B439ZGYM3&x-algolia-api-key=14a0c8d17665d52e61167cc1b2ae9ff1';
  let hs = [];
  let a = true;
  let page = 0;
  while (a) {
    const b = `{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_list%22%5D&maxValuesPerFacet=500&query=&page=${page}&hitsPerPage=1000&facets=%5B%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters="}]}`;
    const r = await axios.post(u, b);
    const h = _.get(r, 'data.results.0.hits');
    if (_.size(h) == 0) a = false;
    hs = hs.concat(h);
    page += 1;
  }

  return Promise.resolve(hs);
};

const get3 = async () => {
  const u = 'https://graphql.messari.io/query';
  let hs = [];
  let a = true;
  let after = 1;
  const b = {
    operationName: 'AggregatedContents',
    variables: {
      first: 100000,
      where: {
        title_like: null,
        assetSlugs_in: null,
        subTypes_in: ['OFFICIAL_PROJECT_UPDATES', 'RESEARCH'],
      },
      after: '0',
    },
    query:
      'query AggregatedContents($first: Int, $after: PaginationCursor, $last: Int, $before: PaginationCursor, $where: AggregatedContentWhereInput) {\n  aggregatedContents(\n    first: $first\n    after: $after\n    last: $last\n    before: $before\n    where: $where\n  ) {\n    totalCount\n    pageInfo {\n      hasPreviousPage\n      hasNextPage\n      startCursor\n      endCursor\n      __typename\n    }\n    edges {\n      cursor\n      node {\n        id\n        subType\n        type\n        title\n        publishDate\n        link\n        assets {\n          id\n          name\n          slug\n          symbol\n          __typename\n        }\n        source {\n          id\n          platform\n          link\n          creator {\n            id\n            name\n            link\n            slug\n            ... on AssetCreator {\n              id\n              name\n              slug\n              asset {\n                id\n                name\n                slug\n                logo\n                __typename\n              }\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n',
  };
  const r = await axios.post(u, b);
  const r2 = _.get(r, 'data.data.aggregatedContents.edges');

  const r3 = _.map(r2, 'node');

  const r4 = _.map(r3, (it) => {
    const it2 = {};
    it2.subType = it.subType;
    it2.title = it.title;
    const dt = new Date(it.publishDate * 1000);
    it2.publishDate = ` ${dt.getDate()}/${
      dt.getMonth() + 1
    }/${dt.getFullYear()}`;
    it2.link = it.link;
    it2.assets = _.join(_.map(it.assets, 'name'), ',');
    it2.source =
      _.get(it, 'source.platform') + ' ' + _.get(it, 'source.creator.name');
    if (it.subType == 'OFFICIAL_PROJECT_UPDATES') {
      it2.subType = 'OFFICIAL';
    }
    return it2;
  });
  return Promise.resolve(r4);
};

app.use(express.static('static'));
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(path.resolve('pages/index.html'));
});

app.listen(port || 5000, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.get('/coin', async (req, res) => {
  try {
    try {
      await axios.get(
        'https://java-crypto.herokuapp.com/post/fetchMessari?limit=10000'
      );
      console.log('Craw research success');
    } catch (e) {
      console.log('Craw research Error');
      console.log(e);
    }

    let research = [];
    try {
      research = await axios.get(
        'https://java-crypto.herokuapp.com/post/getAll'
      );
      console.log('Fetch research success');
    } catch (e) {
      console.log('Fetch research Error');
      console.log(e);
    }

    const news = await get3();
    // const news = [];
    console.log('Fetch news success');
    // const intel = [];
    const intel = await get();
    console.log('Fetch intel success');
    const GITHUB_TOKEN = req.query.tk;
    const ssid = uuidv4();
    const octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });
    console.log('Start Octokit success');
    const rsha = await octokit.repos.getContent({
      owner: 'lamnt95',
      repo: 'coindb2',
      path: 'README.md',
    });
    const sha = rsha?.data?.sha;
    console.log('Fetch sha success');
    const cmit = await octokit.repos.createOrUpdateFileContents({
      owner: 'lamnt95',
      repo: 'coindb2',
      path: 'README.md',
      message: ssid,
      content: Buffer.from(ssid).toString('base64'),
      sha,
    });
    console.log('Commit readme.md success');

    const newStr = JSON.stringify(news);
    const cmitNews = await octokit.repos.createOrUpdateFileContents({
      owner: 'lamnt95',
      repo: 'coindb2',
      path: ssid + '/news-' + ssid + '.json',
      message: ssid,
      content: Buffer.from(newStr).toString('base64'),
      sha,
    });
    console.log('Commit new success');

    const intelStr = JSON.stringify(intel);
    const cmitIntels = await octokit.repos.createOrUpdateFileContents({
      owner: 'lamnt95',
      repo: 'coindb2',
      path: ssid + '/intel-' + ssid + '.json',
      message: ssid,
      content: Buffer.from(intelStr).toString('base64'),
      sha,
    });

    console.log('Commit intel success');

    const researchStr = JSON.stringify(research);
    const cmitResearch = await octokit.repos.createOrUpdateFileContents({
      owner: 'lamnt95',
      repo: 'coindb2',
      path: ssid + '/research-' + ssid + '.json',
      message: ssid,
      content: Buffer.from(researchStr).toString('base64'),
      sha,
    });
    console.log('Commit research success');

    res.send('OK');
  } catch (eglobal) {
    console.log(eglobal);
    res.send('error');
  }
});

const cf = [
  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1640995200%22%2C%22eventDate%3C%3D1643673599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1638316800%22%2C%22eventDate%3C%3D1640995199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1635724800%22%2C%22eventDate%3C%3D1638316799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1633046400%22%2C%22eventDate%3C%3D1635724799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1630454400%22%2C%22eventDate%3C%3D1633046399%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1627776000%22%2C%22eventDate%3C%3D1630454399%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1625097600%22%2C%22eventDate%3C%3D1627775999%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1622505600%22%2C%22eventDate%3C%3D1625097599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1619827200%22%2C%22eventDate%3C%3D1622505599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1617235200%22%2C%22eventDate%3C%3D1619827199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1614556800%22%2C%22eventDate%3C%3D1617235199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1612137600%22%2C%22eventDate%3C%3D1614556799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1609459200%22%2C%22eventDate%3C%3D1612137599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1606780800%22%2C%22eventDate%3C%3D1609459199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1604188800%22%2C%22eventDate%3C%3D1606780799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1601510400%22%2C%22eventDate%3C%3D1604188799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1598918400%22%2C%22eventDate%3C%3D1601510399%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1596240000%22%2C%22eventDate%3C%3D1598918399%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1593561600%22%2C%22eventDate%3C%3D1596239999%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1590969600%22%2C%22eventDate%3C%3D1593561599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1588291200%22%2C%22eventDate%3C%3D1590969599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1585699200%22%2C%22eventDate%3C%3D1588291199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1583020800%22%2C%22eventDate%3C%3D1585699199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1580515200%22%2C%22eventDate%3C%3D1583020799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1577836800%22%2C%22eventDate%3C%3D1580515199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1575158400%22%2C%22eventDate%3C%3D1577836799%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1572566400%22%2C%22eventDate%3C%3D1575158399%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1569888000%22%2C%22eventDate%3C%3D1572566399%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1567296000%22%2C%22eventDate%3C%3D1569887999%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1564617600%22%2C%22eventDate%3C%3D1567295999%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1561939200%22%2C%22eventDate%3C%3D1564617599%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',

  '{"requests":[{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1000&maxValuesPerFacet=500&facets=%5B%22eventDate%22%2C%22assets%22%2C%22category%22%2C%22importance%22%2C%22status%22%2C%22subCategory%22%2C%22tags%22%5D&tagFilters=&numericFilters=%5B%22eventDate%3E%3D1559347200%22%2C%22eventDate%3C%3D1561939199%22%5D"},{"indexName":"event","params":"highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&analyticsTags=%5B%22location_intel%22%2C%22intel_view_calendar%22%5D&hitsPerPage=1&maxValuesPerFacet=500&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=eventDate"}]}',
];
