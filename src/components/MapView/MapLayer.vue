<template>
  <div class="outer-container">
    <div class="title-layer">Map View</div>
    <div class="map-container" id="map-container">
      <!-- <svg id="pointLayer" width="100%" height="100%"/> -->
    </div>
    <!-- <svg id="pointLayer" width="100%" height="100%"/> -->
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
// import { map } from '@/utils'
import mapboxgl from 'mapbox-gl'
import turf from 'turf'
import MapboxDraw from 'mapbox-gl-draw'
import { useStore } from 'vuex'
import getData from '@/services'
import { cityGroup } from '@/data'

export default {
  name: 'MapLayer',
  // props: {
  //   updateFlag: Number,
  //   stateObj: Object
  // },
  setup (props, context) {
    const store = useStore(),
          state = store.state
    getData(store, 'city_loc')
    const stateObj = computed(() => state).value

    let map
    let draw
    let cityList = []
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGV6aGFudmlzIiwiYSI6ImNraThnYWoxcDA1aXkycnMzMGxhcDcxeGgifQ.pbnOr8oKR894OJ3seHIayg'
    // const project = d3.geoMercator();
    // const unproject = d3.geoMercator().invert;
    
    function getLL(d) {
      return new mapboxgl.LngLat(+d.lng, +d.lat)
    }

    function project(d) {
      return map.project(getLL(d));
    }

    const initDraw = () => {
      draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          // line_string: true,
          // point: true,
          trash: true
        }
      })
      map.addControl(draw, 'bottom-right')
      map.on('draw.create', updateArea)
      map.on('draw.update', updateArea)
      map.on('draw.delete', updateArea)
    }

    const updateArea = (e) => {
      map.setFilter("points-selected", ["==", "group", ""]);
      if (e.type === 'draw.delete') {
        map.setFilter("points-selected", ["in", "index", ""]);
        // map.setFilter("points-selected", ["==", "group", ""]);
        cityList = []
        store.commit('setData', {
          field: 'city_id_list',
          data: cityList
        })
        return
      }

      var data = draw.getAll()
      if (data.features.length > 0) {
        var userPolygon = e.features[0];
        var polygonBoundingBox = turf.bbox(userPolygon);
        var southWest = [polygonBoundingBox[0], polygonBoundingBox[1]];
        var northEast = [polygonBoundingBox[2], polygonBoundingBox[3]];
        var northEastPointPixel = map.project(northEast);
        var southWestPointPixel = map.project(southWest);
        var features = map.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], { layers: ['points'] });
        var filter = features.reduce(function(memo, feature) {
          if (! (undefined === turf.intersect(feature, userPolygon))) {
            // only add the property, if the feature intersects with the polygon drawn by the user
            // memo.push(feature.properties.title);
            memo.push(feature.properties.index);
          }
          return memo;
        }, []);
        cityList = filter
        store.commit('setData', {
          field: 'city_id_list',
          data: cityList
        })
        map.setFilter("points-selected", ["in", "index", ...filter]);
      } else {
        // answer.innerHTML = '';
      }
    }

    onMounted(() => {
      map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/dezhanvis/ckmcv57z60gjd17rq1jvowlcr',
        center: [105.605285,35.404989],
        zoom: 3.0,
        zoomControl: true
      })
      // console.log(stateObj.cityLocs);

      // 添加缩放控件
      // let nav = new mapboxgl.NavigationControl();
      // map.addControl(nav, 'top-left');

      map._logoControl && map.removeControl(map._logoControl);  // 去除mapbox标志
      
      initDraw()
      // mapView = map.createMap("map-container")
      // mapView.setView([35.604989, 105.805285], 3.5)
      // const cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
      // map.createTileLayer(mapView, 'OSM_light', {attribution: cartodbAttribution})
      // map.createTileLayer(mapView, 'Gaode-normal', {maxZoom: 19})

      // const width = document.getElementById("map-container").clientWidth
      // const height = document.getElementById("map-container").clientHeight
      // const container = map.getCanvasContainer()
    })

    watch (() => stateObj.selectedCities, (oldVlaue, newValue) => {
      map.setFilter("points-selected",["==", "group", stateObj.selectedCities])
      cityList = cityGroup[stateObj.selectedCities]
      store.commit('setData', {
        field: 'city_id_list',
        data: cityList
      })

    })

    watch (() => stateObj.focused_city, (oldVlaue, newValue) => {
      map.setFilter("points-focused",["==", "title", stateObj.focused_city])
    })

    watch (() => stateObj.mapPointsUpdate, (oldVlaue, newValue) => {
      // console.log(stateObj.cityLocs);
      map.on('load', () => {
        map.addSource("points", {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": stateObj.cityLocs
          }
        })

        map.addLayer({
          "id": "points",
          "type": "circle",   /* symbol类型layer，一般用来绘制点*/
          "source": "points",
          paint: {
            'circle-radius': 4,
            'circle-color': '#fec006'
          },
        });

        map.addLayer({
          "id": "points-selected",
          "type": "circle",
          "source": "points",
          "paint": {
            'circle-radius': 4,
            'circle-color': '#eb6877'
          },
          "filter": ["==", "group", stateObj.selectedCities]  /* 过滤器，名字为空的数据才显示，也就是默认不使用该layer  */
        });

        // console.log(stateObj.focused_city);
        map.addLayer({
          "id": "points-focused",
          "type": "circle",
          "source": "points",
          "paint": {
            'circle-radius': 5,
            'circle-color': '#0667a0'
          },
          "filter": ["==", "title", '']  /* 过滤器，名字为空的数据才显示，也就是默认不使用该layer  */
        });

        // map.addLayer({
        //   "id": "points-free-selected",
        //   "type": "circle",
        //   "source": "points",
        //   "paint": {
        //     'circle-radius': 4,
        //     'circle-color': '#eb6877'
        //   },
        //   "filter": ["in", "title", ""]  /* 过滤器，名字为空的数据才显示，也就是默认不使用该layer  */
        // });
        

        // var selFeatures = map.queryRenderedFeatures({ layers: ["points-selected"] });
        // if (selFeatures.length) {
        //   map.setFilter("points-selected", ["==", "group", props.stateObj.selectedCities]);
        // } else {
        //   map.setFilter("points-selected", ["==", "group", ""]);
        // }

        let popup = new mapboxgl.Popup({
          offsets: [ 0, 0 ],
          closeButton: false,
          background:'#333'
        })
        map.on("mousemove", function(e) {
            let features = map.queryRenderedFeatures(e.point, { layers: ["points"] });/*queryRenderedFeatures  ([geometry], [parameters]):返回满足查询条件并且能够可视化的Geojson特性对象数组，查询条件可以是layers或者filter，如果是layers，则在这些layer之内的特性能够返回  */
            if (features.length) {
                // console.log(features[0].properties.title);
                // console.log(e.point);
                popup
                .setHTML(`<span style="color:'#fff'">${features[0].properties.title}</span>`)
                .setLngLat(features[0].geometry.coordinates)
                .addTo(map)
            } else {
                popup.remove()
            }
        });
    
        // Reset the state-fills-hover layer's filter when the mouse leaves the map
        map.on("mouseout", function() {
            popup.remove()
        });

        map.on("click", function(e) {
          let features = map.queryRenderedFeatures(e.point, { layers: ["points"] });
          if (features.length) {
              // console.log(features[0].properties.title);
              // console.log(e.point);
              if (stateObj.selCityList.indexOf(features[0].properties.title) !== -1) {
                store.commit('setData', {
                  field: 'focused_city',
                  data: features[0].properties.title
                })
              }
              popup
              .setHTML(`<span style="color:'#fff'">${features[0].properties.title}</span>`)
              .setLngLat(features[0].geometry.coordinates)
              .addTo(map)
          } else {
              popup.remove()
          }
        })
      })

        // console.log(stateObj.mapPointsUpdate);
        // console.log(stateObj.selectedCities);
      // let points = svg.selectAll("circle")
      //     .data(strToJson(props.cityLocs))
      //     .enter()
      //     .append("circle")
      //     .attr("cx", function(d) {
      //       return project(d).x;
      //     })
      //     .attr("cy", function(d) {
      //       return project(d).y;
      //     })
      //     .attr("r", 3.8)
      //     .attr("fill", "#fec006");

    })

  }
}
</script>

<style scoped>
@import url('https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css');

.outer-container {
  width: 580px;
  height: 420px;
  border: solid 1px #b2b5b5;
  /* padding: 1px; */
  margin: 1px;
}

.map-container {
  position: absolute;
  /* left: 300; */
  width: 578px;
  height: 394px;
}

#pointLayer {
  position: relative;
}

.title-layer {
  /* position: absolute; */
  z-index: 80;
  width: 579px;
  height: 24px;
  text-align: left;
  padding-left: 12px;
  background-color: #6c757d;
  color: #fff;
}
  
</style>