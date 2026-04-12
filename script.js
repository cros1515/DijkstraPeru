let map, graph, polyline;

// Referencias del DOM
const startSelect = document.getElementById("start");
const endSelect = document.getElementById("end");
const info = document.getElementById("info");

const capitals = {
  Amazonas: { lat: -6.2317, lng: -77.8690 },
  Ancash: { lat: -9.5278, lng: -77.5278 },
  Apurimac: { lat: -13.6339, lng: -72.8814 },
  Arequipa: { lat: -16.4090, lng: -71.5375 },
  Ayacucho: { lat: -13.1631, lng: -74.2236 },
  Cajamarca: { lat: -7.1638, lng: -78.5003 },
  Callao: { lat: -12.0508, lng: -77.1257 },
  Cusco: { lat: -13.5319, lng: -71.9675 },
  Huancavelica: { lat: -12.7826, lng: -74.9727 },
  Huanuco: { lat: -9.9306, lng: -76.2422 },
  Ica: { lat: -14.0678, lng: -75.7286 },
  Junin: { lat: -12.0651, lng: -75.2049 },
  LaLibertad: { lat: -8.1116, lng: -79.0288 },
  Lambayeque: { lat: -6.7714, lng: -79.8409 },
  Lima: { lat: -12.0464, lng: -77.0428 },
  Loreto: { lat: -3.7491, lng: -73.2538 },
  MadreDeDios: { lat: -12.5933, lng: -69.1891 },
  Moquegua: { lat: -17.1934, lng: -70.9350 },
  Pasco: { lat: -10.6864, lng: -76.2622 },
  Piura: { lat: -5.1945, lng: -80.6328 },
  Puno: { lat: -15.8402, lng: -70.0219 },
  SanMartin: { lat: -6.0346, lng: -76.9717 },
  Tacna: { lat: -18.0066, lng: -70.2463 },
  Tumbes: { lat: -3.5669, lng: -80.4515 },
  Ucayali: { lat: -8.3791, lng: -74.5539 }
};

const connections = {
  Puno: ["Cusco", "Arequipa", "Moquegua","MadreDeDios","Tacna"],
  Cusco: ["Puno", "Apurimac", "MadreDeDios", "Arequipa","Junin","Ucayali"],
  Apurimac: ["Cusco", "Ayacucho", "Arequipa"],
  Arequipa: ["Ica", "Ayacucho", "Apurimac", "Cusco", "Puno", "Moquegua"],
  Moquegua: ["Arequipa", "Puno", "Tacna"],
  Tacna: ["Moquegua","Puno"],
  Ayacucho: ["Ica", "Huancavelica", "Apurimac", "Arequipa"],
  Ica: ["Lima", "Ayacucho", "Arequipa","Huancavelica"],
  Huancavelica: ["Lima", "Ayacucho", "Junin","Ica"],
  Junin: ["Lima", "Huancavelica", "Pasco","Cusco","Ucayali"],
  Lima: ["Ica", "Huancavelica", "Junin", "Ancash", "Callao","Pasco"],
  Callao: ["Lima"],
  Ancash: ["Lima", "LaLibertad","Huanuco"],
  LaLibertad: ["Ancash", "Lambayeque","SanMartin","Cajamarca"],
  Lambayeque: ["LaLibertad", "Piura","Cajamarca"],
  Piura: ["Lambayeque", "Tumbes","Cajamarca"],
  Tumbes: ["Piura"],
  Cajamarca: ["Lambayeque", "Amazonas", "LaLibertad","Piura"],
  Amazonas: ["Cajamarca", "Loreto","SanMartin"],
  Loreto: ["Amazonas", "SanMartin", "Ucayali"],
  SanMartin: ["Loreto", "Huanuco","LaLibertad","Amazonas"],
  Huanuco: ["SanMartin", "Pasco", "Ucayali","Ancash"],
  Pasco: ["Huanuco", "Junin","Ucayali"],
  Ucayali: ["Huanuco", "Loreto","MadreDeDios","Pasco","Junin"],
  MadreDeDios: ["Cusco","Puno","Ucayali"]
};

function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const val = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(val), Math.sqrt(1-val)));
}

function buildGraph() {
  let g = {};
  for (let c in connections) {
    g[c] = {};
    connections[c].forEach(n => { g[c][n] = haversine(capitals[c], capitals[n]); });
  }
  return g;
}

function dijkstra(graph, start) {
  let dist={}, prev={}, visited=new Set();
  for (let n in graph) { dist[n]=Infinity; prev[n]=null; }
  dist[start]=0;
  while (visited.size < Object.keys(graph).length) {
    let cur = Object.keys(graph).filter(n=>!visited.has(n)).reduce((a,b)=>dist[a]<dist[b]?a:b);
    visited.add(cur);
    for (let neigh in graph[cur]) {
      let nd = dist[cur] + graph[cur][neigh];
      if (nd < dist[neigh]) { dist[neigh]=nd; prev[neigh]=cur; }
    }
  }
  return {dist, prev};
}

function getPath(prev, end) {
  let path=[];
  while(end){ path.unshift(end); end=prev[end]; }
  return path;
}

function calcularRuta() {
  let start = startSelect.value;
  let end = endSelect.value;
  let res = dijkstra(graph, start);
  let path = getPath(res.prev, end);
  let coords = path.map(c=>capitals[c]);
  if(polyline) polyline.setMap(null);
  polyline = new google.maps.Polyline({ path: coords, strokeColor: "red", strokeWeight: 4, map: map });
  let html = "<b>Ruta:</b><br>";
  let total=0;
  for(let i=0;i<path.length-1;i++){
    let d = haversine(capitals[path[i]], capitals[path[i+1]]);
    total += d;
    html += `${path[i]} → ${path[i+1]} (${d.toFixed(0)} km)<br>`;
  }
  html += `<br><b>Total:</b> ${total.toFixed(0)} km`;
  info.innerHTML = html;
}

window.iniciarMap = function() {
  map = new google.maps.Map(document.getElementById("map"), { zoom: 6, center: { lat: -9.19, lng: -75.0152 } });
  for (let c in capitals) {
    new google.maps.Marker({ position: capitals[c], map: map, title: c });
    startSelect.innerHTML += `<option>${c}</option>`;
    endSelect.innerHTML += `<option>${c}</option>`;
  }
  graph = buildGraph();
};