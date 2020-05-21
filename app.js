const searchClient = algoliasearch(
  '6B29BTPQED',
  '49ae085a83962db19658af549b3bac7e' // search only API key, no ADMIN key
)

const search = instantsearch({
  searchClient,
  indexName: 'prod_dynamic-faceting',
  routing: false,
})

// initialize SearchBox
search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-box',
    placeholder: 'Search products...',
  })
)

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: `
        <div class="hit">
          <img src="{{image}}" alt="Product image">
          <div class="name">{{{_highlightResult.name.value}}}</div>
        </div>
      `,
    }
  })
)

const rangeSliderWithPanel = instantsearch.widgets.panel({
  templates: {
    header: 'Price',
  },
})(instantsearch.widgets.rangeSlider)

search.addWidget(
  rangeSliderWithPanel({
    container: '#price',
    attribute: 'price',
    tooltips: {
      format: rawValue => '$' + Math.round(rawValue).toLocaleString()
    },
  })
)

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination',
    maxPages: 10,
    scrollTo: false,
  })
)

// handle dynamic facets
let widgets = {}

search.on('render', () => {
  const results = search.helper.lastResults

  if (results.userData && results.userData[0].type === 'dynamic_facets') {
    // retrieve facet list
    const facets = results.userData[0].facets

    // remove old attributes
    const toDeleteAttrs = Object.keys(widgets).filter(attr => !facets.includes(attr))
    if (toDeleteAttrs.length > 0) {
      const toDeleteRefs = toDeleteAttrs.map(attr => widgets[attr])
      search.removeWidgets(toDeleteRefs)
      toDeleteAttrs.forEach(attr => delete widgets[attr])
    }

    // add new attributes
    const toAdd = facets.filter(attr => !widgets.hasOwnProperty(attr)).map(attr => { widgets[attr] = createWidget(attr); return widgets[attr]; })
    if (toAdd.length > 0) {
      search.addWidgets(toAdd)
    }
  }
  else {
    // delete all
    const toDeleteRefs = Object.keys(widgets).map(attr => widgets[attr])
    if (toDeleteRefs.length > 0) {
      search.removeWidgets(toDeleteRefs)
      widgets = {}
    }
  }
})

const createWidget = attr => {
  const refinementListWithPanel = instantsearch.widgets.panel({
    templates: {
      header: attr,
    },
  })(instantsearch.widgets.refinementList)

  let container = document.getElementById(attr)
  if (!container) {
    container = document.createElement('div')
    container.id = attr
    document.getElementById('refinement-lists').appendChild(container)
  }
  return refinementListWithPanel({
    container: container,
    attribute: attr,
    operator: 'or',
    limit: 10,
  })
}

// start
search.start()
