import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
// import chinatms from 'leaflet.chinatmsproviders'
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { options } from 'less';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize:     [30, 50], // size of the icon
  shadowSize:   [50, 64], // size of the shadow
  iconAnchor:   [15, 50], // point of the icon which will correspond to marker's location
  shadowAnchor: [15, 64],  // the same for the shadow
  popupAnchor:  [0, -40] // point from which the popup should open relative to the iconAnchor
})
L.Marker.prototype.options.icon = DefaultIcon

const OSMUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const OSMUrl_light = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

const createMap = (divId, options) => {
  const map = L.map(divId, options)
  return map
}

//添加创建地图的函数
const createTileLayer = (map, source, options) => {
  let tileLayer
  switch (source) {
    case 'OSM':
      tileLayer = L.tileLayer(OSMUrl, options)
      break
    case 'OSM_light':
      tileLayer = L.tileLayer(OSMUrl_light, options)
      break
    case 'Google-normal':
      tileLayer = L.tileLayer.chinaProvider('Google.Normal.Map', options)
      break
    case 'Google-satellite':
      tileLayer = L.tileLayer.chinaProvider('Google.Satellite.Map', options)
      break
    case 'Gaode-normal':
      tileLayer = L.tileLayer.chinaProvider('GaoDe.Normal.Map', options)
      break
    case 'Gaode-satellite-map':
      tileLayer = L.tileLayer.chinaProvider('GaoDe.Satellite.Map', options)
      break
    case 'Gaode-satellite-map':
      tileLayer = L.tileLayer.chinaProvider('GaoDe.Satellite.Annotion', options)
      break
    default:
      break
  }
  
  tileLayer.addTo(map)
  map._onResize();
  return tileLayer
}

const addMarker = (map, pos, opt) => {
  const marker = L.marker(pos, opt)
  marker.addTo(map)
  return marker
}

const addCircle = (map, pos, options) => {
  const circle = L.circle(pos, options)
  circle.addTo(map)
  return circle
}

const addPolygon = (map, points) => {
  const polygon = L.polygon(points).addTo(map);
  return polygon
}

const addPopup = (map, pos, text) => {
  const popup = L.popup()
  popup.setLatLng(pos).setContent(text)
  popup.openOn(map)
  return popup
}

var LeafIcon = L.Icon.extend({
  options: {
      shadowUrl: 'leaf-shadow.png',
      iconSize:     [38, 95],
      shadowSize:   [50, 64],
      iconAnchor:   [22, 94],
      shadowAnchor: [4, 62],
      popupAnchor:  [-3, -76]
  }
})

const createIcon = (options) => {
  const icon = L.icon(options)
  return icon
}

const extendIcon = (option, type) => {
  let icon
  switch (type) {
    case 'leaf':
      icon = new LeafIcon(option);
      break
    default:
      icon = L.icon(options)
      break
  }
  return icon
}

const createGeoJson = (map, json, options) => {
  const geoJson = L.geoJSON(json, options)
  geoJson.addTo(map)
  return geoJson
}

// const addTooltip = (layer, options) => {
//   const tooltip = L.Tooltip
// }

export default {
  createMap,
  createTileLayer,
  addMarker,
  addCircle,
  addPolygon,
  addPopup,
  createIcon,
  extendIcon,
  createGeoJson
}