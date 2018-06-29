
function drawGraph(network) {

  console.log(network)
  let nodes = network.nodes
  let edges = network.getGraph().edges

  let makeGObject = go.GraphObject.make
  let layoutInfo = {
    columnSpacing: 25,
    layerSpacing: 25,
  }

  let graph = makeGObject(go.Diagram, "network", {
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

}
