// Página HTML del mapa (Leaflet + teselas de OpenStreetMap). No requiere llave de API.
// CARTO dejó de servir teselas sin llave, así que se usan las de OSM y el tema oscuro se logra con un filtro CSS.
export function construirHtmlMapa(oscuro: boolean, centro: { lat: number; lng: number }): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:${oscuro ? '#0b1020' : '#eef2f7'};}
  .leaflet-control-attribution{font-size:9px;opacity:.7}
  ${oscuro ? '.leaflet-tile-pane{filter:invert(1) hue-rotate(200deg) brightness(.85) contrast(.9) saturate(.6)}' : ''}
  .pin{transform:translate(-50%,-100%);display:inline-flex;align-items:center;gap:4px;white-space:nowrap;
    font:700 12px -apple-system,Roboto,sans-serif;color:#fff;padding:6px 10px;border-radius:999px;
    box-shadow:0 6px 14px rgba(3,4,94,.35);border:2px solid #fff;transition:transform .25s cubic-bezier(.3,1.6,.5,1)}
  .pin{position:relative}
  .pin:after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-6px;border:6px solid transparent;border-top-color:var(--c);border-bottom:0}
  .pin .dot{width:7px;height:7px;border-radius:50%;background:#fff}
  .alta{--c:#0077B6;background:#0077B6}
  .baja{--c:#C2410C;background:#C2410C}
  .lleno{--c:#6B7280;background:#6B7280}
  .sel{--c:#03045E;transform:translate(-50%,-100%) scale(1.25);background:#03045E}
  .yo{width:18px;height:18px;border-radius:50%;background:#00B4D8;border:3px solid #fff;box-shadow:0 0 0 0 rgba(0,180,216,.6);animation:pulso 1.8s infinite;transform:translate(-50%,-50%)}
  @keyframes pulso{0%{box-shadow:0 0 0 0 rgba(0,180,216,.55)}70%{box-shadow:0 0 0 18px rgba(0,180,216,0)}100%{box-shadow:0 0 0 0 rgba(0,180,216,0)}}
  @keyframes caer{from{opacity:0;margin-top:-18px}to{opacity:1;margin-top:0}}
  .entra{animation:caer .45s cubic-bezier(.3,1.5,.5,1) both}
</style></head>
<body><div id="map"></div>
<script>
  var enviar = function(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var map = L.map('map', { zoomControl:false, attributionControl:true }).setView([${centro.lat}, ${centro.lng}], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  var marcas = {}; var yo = null; var seleccion = null; var primera = true;
  function icono(p, sel, i){
    return L.divIcon({ className:'', iconSize:[0,0],
      html: '<div class="pin '+p.nivel+(sel?' sel':'')+(primera?' entra':'')+'" style="animation-delay:'+(i*40)+'ms"><span class="dot"></span>'+p.etiqueta+'</div>' });
  }
  window.ponerDatos = function(datos){
    var ids = {};
    datos.parqueaderos.forEach(function(p, i){
      ids[p.id] = true;
      var sel = p.id === datos.seleccion;
      if (marcas[p.id]) { marcas[p.id].setIcon(icono(p, sel, 0)); }
      else {
        var m = L.marker([p.lat, p.lng], { icon: icono(p, sel, i), riseOnHover:true }).addTo(map);
        m.on('click', function(){ enviar({ tipo:'seleccion', id:p.id }); });
        marcas[p.id] = m;
      }
      marcas[p.id].setZIndexOffset(sel ? 1000 : 0);
    });
    Object.keys(marcas).forEach(function(id){ if(!ids[id]){ map.removeLayer(marcas[id]); delete marcas[id]; } });
    if (datos.yo) {
      if (!yo) yo = L.marker([datos.yo.lat, datos.yo.lng], { icon: L.divIcon({ className:'', iconSize:[0,0], html:'<div class="yo"></div>' }), interactive:false }).addTo(map);
      else yo.setLatLng([datos.yo.lat, datos.yo.lng]);
    }
    primera = false;
  };
  window.volar = function(lat, lng, zoom){ map.flyTo([lat, lng], zoom || 15, { duration: 0.8 }); };
  map.on('click', function(){ enviar({ tipo:'fondo' }); });
  enviar({ tipo:'listo' });
</script></body></html>`;
}
