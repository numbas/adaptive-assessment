let networkNo = 0

function drawGraph(network, size) {
  let divId = "network" + networkNo
  let nodes = network.nodes
  let groups = network.groups
  let edges = network.getGraph().edges

  addNewDiv("page", divId, size)

  let makeGObject = go.GraphObject.make
  let layoutInfo = {
    columnSpacing: 25,
    layerSpacing: 25,
  }

  let graph = makeGObject(go.Diagram, divId, {
      "undoManager.isEnabled": true,
      layout: makeGObject(go.LayeredDigraphLayout, layoutInfo)
    })

  let model = makeGObject(go.GraphLinksModel)

  model.nodeKeyProperty = "tag"
  model.nodeDataArray = [...nodes]
  model.linkDataArray = [...edges]

  graph.model = model

  graph.nodeTemplate =
  makeGObject(go.Node, "Vertical", {background: "#a7a7b7"},
  makeGObject(go.TextBlock, new go.Binding("text", "tag")),
  makeGObject(go.TextBlock, new go.Binding("text", "description"))
  )

  // graph.linkTemplate =
  // makeGObject(
  //   go.Link, {},
  //   makeGObject(go.Shape, {strokeWidth: 3, stroke: "#555"})
  // )

  networkNo++
}

function addNewDiv(pageid, id, size) {
  let width = size.width
  let height = size.height
  let page = document.getElementById(pageid)
  let div = "<div id=\""+ id + "\"style=\"width:" + width + "px; height:" + height + "px; background-color: #DAE4E4; margin: 10px;\"></div>"
  page.insertAdjacentHTML('beforeend', div)
}
