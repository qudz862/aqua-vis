<template>
  <div class="config-title">
    <span class="iconfont">&#xe712;</span> Subspace Selection
  </div>
  <div class="local-global-config">
    <div class="form-check">
      <input class="form-check-input" type="radio" name="subspaceRadio" id="flexRadioDefault1" value="local" v-model="local_flag">
      <label class="form-check-label" for="flexRadioDefault1">Local</label>
    </div>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="subspaceRadio" id="flexRadioDefault2" value="global" v-model="local_flag">
      <label class="form-check-label" for="flexRadioDefault2">Global</label>
    </div>
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" id="flexSwitchCheckDefault" @click="setMDSState($event)">
      <!-- <label class="form-check-label" for="flexSwitchCheckDefault">Relative</label> -->
      <label class="form-check-label" for="flexSwitchCheckDefault">MDS</label>
    </div>
  </div>
  <div class="svg-container">
    <svg id="subspaceView" width=240 height=240 />
  </div>
  <div class="cluster-num">
    <div>Number of Clusters: </div>
    <input id="cluster-num-input" class="form-control" type="text" v-model="cluster_num">
  </div>
  <div>
    <button id="clustering-btn" type="button" class="btn btn-secondary" @click="getClusterResult()">
      <!-- <span class="iconfont">&#xe663;</span>  -->
      Air Quality Summarization
    </button>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import getData from '@/services'
import { aqiColorScheme } from '@/data'

export default {
  name: 'SubspaceConfig',
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    const width = 240
    const height = 240

    let svg
    let graph
    let legend
    let force
    let link
    let node
    // let drNode
    // let drLink
    let circles
    let text
    let inforObj
    let coordObj
    let relative_entropy_local
    let relative_entropy_global
    let varMax
    let varList = []

    let local_flag = ref('local')
    let relative_flag = ref(false)
    let cluster_num = ref(6)

    const radius = d3.scaleSqrt().range([0, 5]);//值域

    let varFlag = [1, 1, 1, 1, 1, 1]

    let mdsChecked = ref(false)

    const setMDSState = (e) => {
      mdsChecked.value = e.target.checked
      // console.log(mdsChecked);
    }

    onMounted(() => {
      svg = d3.select("#subspaceView")
    })

    // const colorList = ['00FF00', '#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const colorList = [d3.interpolateRdYlGn(1), d3.interpolateRdYlGn(0.6), d3.interpolateRdYlGn(0.4), d3.interpolateRdYlGn(0.3), d3.interpolateRdYlGn(0.2), d3.interpolateRdYlGn(0.1), d3.interpolateRdYlGn(0)]
    // const aqiColorScheme = d3.scaleLinear()
    //   .domain([0, 50, 100, 150, 200, 300, 500])
    //   .range(colorList)

    function tick() {
      const scale = 3
      link.selectAll("line")
          .attr("x1", function(d) { return d.source.x * scale + width/2; })
          .attr("y1", function(d) { return d.source.y * scale + height/2})
          .attr("x2", function(d) { return d.target.x * scale + width/2; })
          .attr("y2", function(d) { return d.target.y * scale + height/2 });

      node.attr("transform", function(d) {
        return "translate(" + (d.x*scale+width/2) + "," + (d.y*scale+height/2) + ")";
        });
    }

    function drawForceDirect () {
      // d3.select('.force-region').remove()
      inforObj = stateObj.airQualityInfor['infor']
      // console.log(stateObj.airQualityInfor);
      let avgAirVal = inforObj.max_air_quality
      varMax = Math.max(...avgAirVal)
      const colors = d3.scaleLinear()
        .domain([0, varMax])
        .range([0, 1])
      
      let entropyVal
      if (local_flag.value === 'local') entropyVal = inforObj['entropy_local']
      else if (local_flag.value === 'global') entropyVal = inforObj['entropy_global']
      const entropyScale = d3.scaleLinear()
        .domain([0, Math.max(...entropyVal)])
        .range([0.1, 1])
      
      let miVal
      if (local_flag.value === 'local') miVal = inforObj['mutual_infor_local']
      else if (local_flag.value === 'global') miVal = inforObj['mutual_infor_global']
      const miScale = d3.scaleLinear()
        .domain([0, Math.max(...miVal)])
        .range([0.1, 1])

      force = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.id; }))
          .force("charge", d3.forceManyBody().strength(-65))
      graph = {
        "nodes": [
          {"id": "0", "name": "PM2.5", "entropy_local": inforObj.entropy_local[0], "entropy_global": inforObj.entropy_global[0], "avg_air_quality": inforObj.avg_air_quality[0]},
          {"id": "1", "name": "PM10", "entropy_local": inforObj.entropy_local[1], "entropy_global": inforObj.entropy_global[1], "avg_air_quality": inforObj.avg_air_quality[1]},
          {"id": "2", "name": "SO2", "entropy_local": inforObj.entropy_local[2], "entropy_global": inforObj.entropy_global[2], "avg_air_quality": inforObj.avg_air_quality[2]},
          {"id": "3", "name": "NO2", "entropy_local": inforObj.entropy_local[3], "entropy_global": inforObj.entropy_global[3], "avg_air_quality": inforObj.avg_air_quality[3]},
          {"id": "4", "name": "CO", "entropy_local": inforObj.entropy_local[4], "entropy_global": inforObj.entropy_global[4], "avg_air_quality": inforObj.avg_air_quality[4]},
          {"id": "5", "name": "O3", "entropy_local": inforObj.entropy_local[5], "entropy_global": inforObj.entropy_global[5], "avg_air_quality": inforObj.avg_air_quality[5]}
        ],
        "links": [
          {"source": "0", "target": "1", "mutual_infor_local": inforObj.mutual_infor_local[0], "mutual_infor_global": inforObj.mutual_infor_global[0]},
          {"source": "0", "target": "2", "mutual_infor_local": inforObj.mutual_infor_local[1], "mutual_infor_global": inforObj.mutual_infor_global[1]},
          {"source": "0", "target": "3", "mutual_infor_local": inforObj.mutual_infor_local[2], "mutual_infor_global": inforObj.mutual_infor_global[2]},
          {"source": "0", "target": "4", "mutual_infor_local": inforObj.mutual_infor_local[3], "mutual_infor_global": inforObj.mutual_infor_global[3]},
          {"source": "0", "target": "5", "mutual_infor_local": inforObj.mutual_infor_local[4], "mutual_infor_global": inforObj.mutual_infor_global[4]},
          {"source": "1", "target": "2", "mutual_infor_local": inforObj.mutual_infor_local[5], "mutual_infor_global": inforObj.mutual_infor_global[5]},
          {"source": "1", "target": "3", "mutual_infor_local": inforObj.mutual_infor_local[6], "mutual_infor_global": inforObj.mutual_infor_global[6]},
          {"source": "1", "target": "4", "mutual_infor_local": inforObj.mutual_infor_local[7], "mutual_infor_global": inforObj.mutual_infor_global[7]},
          {"source": "1", "target": "5", "mutual_infor_local": inforObj.mutual_infor_local[8], "mutual_infor_global": inforObj.mutual_infor_global[8]},
          {"source": "2", "target": "3", "mutual_infor_local": inforObj.mutual_infor_local[9], "mutual_infor_global": inforObj.mutual_infor_global[9]},
          {"source": "2", "target": "4", "mutual_infor_local": inforObj.mutual_infor_local[10], "mutual_infor_global": inforObj.mutual_infor_global[10]},
          {"source": "2", "target": "5", "mutual_infor_local": inforObj.mutual_infor_local[11], "mutual_infor_global": inforObj.mutual_infor_global[11]},
          {"source": "3", "target": "4", "mutual_infor_local": inforObj.mutual_infor_local[12], "mutual_infor_global": inforObj.mutual_infor_global[12]},
          {"source": "3", "target": "5", "mutual_infor_local": inforObj.mutual_infor_local[13], "mutual_infor_global": inforObj.mutual_infor_global[13]},
          {"source": "4", "target": "5", "mutual_infor_local": inforObj.mutual_infor_local[14], "mutual_infor_global": inforObj.mutual_infor_global[14]}
        ]
      }

      relative_entropy_local = inforObj.relative_entropy_local
      relative_entropy_global = inforObj.relative_entropy_global 

      force.nodes(graph.nodes).on("tick", tick)
      force.force('link').links(graph.links)

      link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("g")
            .attr("class", "link")
      link.append("line")
          .style("stroke-width", function(d, i) { 
            // if (local_flag.value === 'local') return d.mutual_infor_local*11;
            // else if (local_flag.value === 'global') return d.mutual_infor_global*11;
            return miScale(miVal[i]) * 10
          })
          .attr("stroke","#afb0b0")

      node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")

      circles = node.append("circle")
          .attr("r", function(d, i) {
            // if (local_flag.value === 'local') return d.entropy_local * 4;
            // else if (local_flag.value === 'global') return d.entropy_global * 4;
            return entropyScale(entropyVal[i]) * 14
          })
          .style("cursor", "pointer")
          .attr("fill", function(d,i){
            // console.log(avgAirVal[i], colors(avgAirVal[i]));
            // console.log(d3.interpolateReds(colors(avgAirVal[i])));
            let tmpAQI = avgAirVal[i]
            if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
            else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
          })
          .style("stroke", function(d,i){
            if (varFlag[i] === 1) return '#096da8';
            else return '#dddbec'
          })
          .style('stroke-width', 3)
          .on('click', (e, d, i) => {
            console.log('click',e,d);
            varFlag[d.index] = -varFlag[d.index]
            circles.style("stroke", function(d,i) {
              if (varFlag[i] === 1) return '#096da8'
              else return '#c4cce3'
            })
          })
            // $("#subspaceView").empty();
            // drawForceDirect()

      text = node.append('text')
          .attr('text-anchor', 'middle')
          .text(function(d){return d.name;}) 
          .attr("fill","#333")
          .attr("font-size", '14')
          .attr("x", 0)
          .attr("y", 22)
          .attr("dy", ".35em")
          .style({
            'font-size': '10px',
            'font-family': 'Helvetica',
            'font-weight': 600,
            'cursor': 'pointer'
           })
    }

    function drawDimReduction () {
      inforObj = stateObj.airQualityInfor['infor']
      coordObj = stateObj.airQualityInfor['coord']
      let avgAirVal = inforObj.max_air_quality
      varMax = Math.max(...avgAirVal)
      const colors = d3.scaleLinear()
        .domain([0, varMax])
        .range([0, 1])
      let coordValX, coordValY, entropyVal, miVal
      // console.log(coordObj['coord_local'], coordObj['coord_global']);
      if (local_flag.value === 'local') {
        entropyVal = inforObj['entropy_local']
        miVal = inforObj['mutual_infor_local']
        coordValX = coordObj['coord_local'].map(val => {
          return val[0]
        })
        coordValY = coordObj['coord_local'].map(val => {
          return val[1]
        })
      }
      else if (local_flag.value === 'global') {
        entropyVal = inforObj['entropy_global']  
        miVal = inforObj['mutual_infor_global']
        coordValX = coordObj['coord_global'].map(val => {
          return val[0]
        })
        coordValY = coordObj['coord_global'].map(val => {
          return val[1]
        })
      }
      console.log(coordObj['coord_local'], coordObj['coord_global']);
      
      const entropyScale = d3.scaleLinear()
        .domain([0, Math.max(...entropyVal)])
        .range([0, 1])
      const miScale = d3.scaleLinear()
        .domain([0, Math.max(...miVal)])
        .range([0, 1])
      const coordScaleX = d3.scaleLinear()
        .domain([Math.min(...coordValX), Math.max(...coordValX)])
        .range([30, 210])
      const coordScaleY = d3.scaleLinear()
        .domain([Math.min(...coordValY), Math.max(...coordValY)])
        .range([20, 190])

      drNode = [
        {"id": "0", "name": "PM2.5", "entropy": entropyVal[0], "avg_air_quality": avgAirVal[0], "x": coordValX[0], "y": coordValY[0]},
        {"id": "1", "name": "PM10", "entropy": entropyVal[1], "avg_air_quality": avgAirVal[1], "x": coordValX[1], "y": coordValY[1]},
        {"id": "2", "name": "SO2", "entropy": entropyVal[2], "avg_air_quality": avgAirVal[2], "x": coordValX[2], "y": coordValY[2]},
        {"id": "3", "name": "NO2", "entropy": entropyVal[3], "avg_air_quality": avgAirVal[3], "x": coordValX[3], "y": coordValY[3]},
        {"id": "4", "name": "CO", "entropy": entropyVal[4], "avg_air_quality": avgAirVal[4], "x": coordValX[4], "y": coordValY[4]},
        {"id": "5", "name": "O3", "entropy": entropyVal[5], "avg_air_quality": avgAirVal[5], "x": coordValX[5], "y": coordValY[5]}
      ]

      drLink = [
        {"source": 0, "target": 1, "mutual_infor": miVal[0]},
        {"source": 0, "target": 2, "mutual_infor": miVal[1]},
        {"source": 0, "target": 3, "mutual_infor": miVal[2]},
        {"source": 0, "target": 4, "mutual_infor": miVal[3]},
        {"source": 0, "target": 5, "mutual_infor": miVal[4]},
        {"source": 1, "target": 2, "mutual_infor": miVal[5]},
        {"source": 1, "target": 3, "mutual_infor": miVal[6]},
        {"source": 1, "target": 4, "mutual_infor": miVal[7]},
        {"source": 1, "target": 5, "mutual_infor": miVal[8]},
        {"source": 2, "target": 3, "mutual_infor": miVal[9]},
        {"source": 2, "target": 4, "mutual_infor": miVal[10]},
        {"source": 2, "target": 5, "mutual_infor": miVal[11]},
        {"source": 3, "target": 4, "mutual_infor": miVal[12]},
        {"source": 3, "target": 5, "mutual_infor": miVal[13]},
        {"source": 4, "target": 5, "mutual_infor": miVal[14]}
      ]

      link = svg.selectAll(".link")
            .data(drLink)
            .enter().append("g")
            .attr("class", "link")
      link.append("line")
          .attr('x1', function(d,i){
            return coordScaleX(drNode[d.source].x)
          })
          .attr('y1', function(d,i){
            return coordScaleY(drNode[d.source].y)
          })
          .attr('x2', function(d,i){
            return coordScaleX(drNode[d.target].x)
          })
          .attr('y2', function(d,i){
            return coordScaleY(drNode[d.target].y)
          })
          .style("stroke-width", function(d, i) { 
            return miScale(d.mutual_infor) * 10
          })
          .attr("stroke","#afb0b0")

      node = svg.selectAll(".node")
            .data(drNode)
            .enter().append("g")
            .attr("class", "node")

      circles = node.append("circle")
          .attr("cx", (d, i) => coordScaleX(d.x))
          .attr("cy", (d, i) => coordScaleY(d.y))
          .attr("r", function(d, i) {
            return entropyScale(d.entropy) * 14
          })
          .attr("fill", function(d,i){
            // console.log(avgAirVal[i], colors(avgAirVal[i]));
            // console.log(d3.interpolateReds(colors(avgAirVal[i])));
            let tmpAQI = d.avg_air_quality
            if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
            else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
          })
          .style("cursor", "pointer")
          .style("stroke", function(d,i){
            if (varFlag[i] === 1) return '#096da8';
            else return '#dddbec'
          })
          .style('stroke-width', 3)
          .on('click', (e, d) => {
            varFlag[d.id] = -varFlag[d.id]
            circles.style("stroke", function(d,i) {
              if (varFlag[i] === 1) return '#096da8'
              else return '#c4cce3'
            })
          })

      text = node.append('text')
          .attr('text-anchor', 'middle')
          .text(function(d){return d.name;}) 
          .attr("fill","#333")
          .attr("font-size", '14')
          .attr("x", (d, i) => coordScaleX(d.x))
          .attr("y", (d, i) => coordScaleY(d.y)+22)
          .attr("dy", ".35em")
          .style({
            'font-size': '10px',
            'font-family': 'Helvetica',
            'font-weight': 600,
            'cursor': 'pointer'
           })
      
    }

    function drawDimReductionMDS () {
      // d3.select('.mds-region').remove()
      inforObj = stateObj.airQualityInfor['infor']
      coordObj = stateObj.airQualityInfor['coord']
      let avgAirVal = inforObj.max_air_quality
      varMax = Math.max(...avgAirVal)
      const colors = d3.scaleLinear()
        .domain([0, varMax])
        .range([0, 1])
      let coordValX, coordValY, entropyVal, miVal
      // console.log(coordObj['coord_local'], coordObj['coord_global']);
      if (local_flag.value === 'local') {
        entropyVal = inforObj['entropy_local']
        miVal = inforObj['mutual_infor_local']
        coordValX = coordObj['coord_local_mds'].map(val => {
          return val[0]
        })
        coordValY = coordObj['coord_local_mds'].map(val => {
          return val[1]
        })
      }
      else if (local_flag.value === 'global') {
        entropyVal = inforObj['entropy_global']  
        miVal = inforObj['mutual_infor_global']
        coordValX = coordObj['coord_global_mds'].map(val => {
          return val[0]
        })
        coordValY = coordObj['coord_global_mds'].map(val => {
          return val[1]
        })
      }
      // console.log(coordObj['coord_local_mds'], coordObj['coord_global_mds']);
      
      const entropyScale = d3.scaleLinear()
        .domain([0, Math.max(...entropyVal)])
        .range([0.1, 1])
      const miScale = d3.scaleLinear()
        .domain([0, Math.max(...miVal)])
        .range([0.1, 1])
      const coordScaleX = d3.scaleLinear()
        .domain([Math.min(...coordValX), Math.max(...coordValX)])
        .range([30, 210])
      const coordScaleY = d3.scaleLinear()
        .domain([Math.min(...coordValY), Math.max(...coordValY)])
        .range([20, 190])
      // console.log(Math.min(...coordValX), Math.max(...coordValX));
      // console.log(Math.min(...coordValY), Math.max(...coordValY));

      const drNode = [
        {"id": "0", "name": "PM2.5", "entropy": entropyVal[0], "avg_air_quality": avgAirVal[0], "x": coordValX[0], "y": coordValY[0]},
        {"id": "1", "name": "PM10", "entropy": entropyVal[1], "avg_air_quality": avgAirVal[1], "x": coordValX[1], "y": coordValY[1]},
        {"id": "2", "name": "SO2", "entropy": entropyVal[2], "avg_air_quality": avgAirVal[2], "x": coordValX[2], "y": coordValY[2]},
        {"id": "3", "name": "NO2", "entropy": entropyVal[3], "avg_air_quality": avgAirVal[3], "x": coordValX[3], "y": coordValY[3]},
        {"id": "4", "name": "CO", "entropy": entropyVal[4], "avg_air_quality": avgAirVal[4], "x": coordValX[4], "y": coordValY[4]},
        {"id": "5", "name": "O3", "entropy": entropyVal[5], "avg_air_quality": avgAirVal[5], "x": coordValX[5], "y": coordValY[5]}
      ]

      const drLink = [
        {"source": 0, "target": 1, "mutual_infor": miVal[0]},
        {"source": 0, "target": 2, "mutual_infor": miVal[1]},
        {"source": 0, "target": 3, "mutual_infor": miVal[2]},
        {"source": 0, "target": 4, "mutual_infor": miVal[3]},
        {"source": 0, "target": 5, "mutual_infor": miVal[4]},
        {"source": 1, "target": 2, "mutual_infor": miVal[5]},
        {"source": 1, "target": 3, "mutual_infor": miVal[6]},
        {"source": 1, "target": 4, "mutual_infor": miVal[7]},
        {"source": 1, "target": 5, "mutual_infor": miVal[8]},
        {"source": 2, "target": 3, "mutual_infor": miVal[9]},
        {"source": 2, "target": 4, "mutual_infor": miVal[10]},
        {"source": 2, "target": 5, "mutual_infor": miVal[11]},
        {"source": 3, "target": 4, "mutual_infor": miVal[12]},
        {"source": 3, "target": 5, "mutual_infor": miVal[13]},
        {"source": 4, "target": 5, "mutual_infor": miVal[14]}
      ]

      // const mdsRegion = svg.append('g').attr('class', 'mds-region')

      let mds_link = svg.selectAll(".link")
            .data(drLink)
            .enter().append("g")
            .attr("class", "link")
      mds_link.append("line")
          .attr('x1', function(d,i){
            return coordScaleX(drNode[d.source].x)
          })
          .attr('y1', function(d,i){
            return coordScaleY(drNode[d.source].y)
          })
          .attr('x2', function(d,i){
            return coordScaleX(drNode[d.target].x)
          })
          .attr('y2', function(d,i){
            return coordScaleY(drNode[d.target].y)
          })
          .style("stroke-width", function(d, i) { 
            return miScale(d.mutual_infor) * 10
          })
          .attr("stroke","#afb0b0")

      let mds_node = svg.selectAll(".node")
            .data(drNode)
            .enter().append("g")
            .attr("class", "node")

      circles = mds_node.append("circle")
          .attr("cx", (d, i) => coordScaleX(d.x))
          .attr("cy", (d, i) => coordScaleY(d.y))
          .attr("r", function(d, i) {
            return entropyScale(d.entropy) * 14
          })
          .attr("fill", function(d,i){
            // console.log(avgAirVal[i], colors(avgAirVal[i]));
            // console.log(d3.interpolateReds(colors(avgAirVal[i])));
            let tmpAQI = d.avg_air_quality
            if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
            else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
          })
          .style("cursor", "pointer")
          .style("stroke", function(d,i){
            if (varFlag[i] === 1) return '#096da8';
            else return '#dddbec'
          })
          .style('stroke-width', 3)
          .on('click', (e, d) => {
            varFlag[d.id] = -varFlag[d.id]
            circles.style("stroke", function(d,i) {
              if (varFlag[i] === 1) return '#096da8'
              else return '#c4cce3'
            })
          })

      text = mds_node.append('text')
          .attr('text-anchor', 'middle')
          .text(function(d){return d.name;}) 
          .attr("fill","#333")
          .attr("font-size", '14')
          .attr("x", (d, i) => coordScaleX(d.x))
          .attr("y", (d, i) => coordScaleY(d.y)+22)
          .attr("dy", ".35em")
          .style({
            'font-size': '10px',
            'font-family': 'Helvetica',
            'font-weight': 600,
            'cursor': 'pointer'
           })
    }

    function drawLegend () {
      let legendScale = d3.scaleLinear().domain([0, 90]).range([0, 500])
      legend = svg.append('g').attr('class', 'subspace-legend')
      legend.selectAll('rect').data(d3.range(90)).enter()
            .append('rect')
            .attr('x', (d,i) => {
              // console.log(d,i);
              return 22+i*2
            })
            .attr('y', height - 20)
            .attr('width', 2)
            .attr('height', 14)
            .attr('fill', (d,i) => {
              let tmpAQI = legendScale(d)
              if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
              else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
              else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
              else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
              else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
            })
      legend.append('text')
            .attr('text-anchor', 'middle')
            .text('0')
            .attr("font-size", '14')
            .attr('x', 12)
            .attr('y', height-8)
      legend.append('text')
            .attr('text-anchor', 'middle')
            .text('500')
            .attr("font-size", '14')
            .attr('x', width-22)
            .attr('y', height-8)
    }

    function getClusterResult () {
      if (varFlag === [-1, -1, -1, -1, -1, -1]) {
        alert('Please select at least one variables.')
        return 
      }
      store.commit('setData', {
        field: 'var_flag',
        data: varFlag
      })

      store.commit('setData', {
        field: 'cluster_num',
        data: cluster_num.value
      })

      getData(store, 'clustering_result', JSON.stringify(varFlag), cluster_num.value)
    }

    watch (() => mdsChecked.value, (oldVlaue, newValue) => {
      $("#subspaceView").empty();
      if (mdsChecked.value) drawDimReductionMDS()
      else drawForceDirect()
      drawLegend()
    })

    watch (() => local_flag.value, (oldVlaue, newValue) => {
      $("#subspaceView").empty();
      // drawForceDirect()
      // drawDimReduction()
      if (mdsChecked.value) drawDimReductionMDS()
      else drawForceDirect()
      drawLegend()
    })
    watch (() => stateObj.airQualityInfor, (oldVlaue, newValue) => {
      $("#subspaceView").empty();
      // drawForceDirect()
      // drawDimReductionMDS()
      if (mdsChecked.value) drawDimReductionMDS()
      else drawForceDirect()
      drawLegend()
    })

    return {
      local_flag,
      relative_flag,
      getClusterResult,
      cluster_num,
      setMDSState
    }
  }
}
</script>

<style scoped>
.config-title {
  font-weight: 600;
  text-align: left;
  margin-left: 10px;
  margin-bottom: 3px;
  margin-top: 10px;
}

.local-global-config {
  width: 240px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  /* align-items: center; */
  /* font-size: 14px !important; */
}

#subspaceView {
  border: solid 1px #c2c5c5;
}

#clustering-btn {
  width: 240px;
  height: 32px;
  padding: 2px 0px;
  margin-top: 6px;
}

.cluster-num {
  width: 240px;
  margin: 0 auto;
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* font-size: 14px; */
}

#cluster-num-input {
  width: 80px;
  font-size: 14px;
  padding: 0 5px;
  height: 28px;
  text-align: center;
}

.svg-container {
  margin-top: 0px;
}

/* .node {
  cursor: pointer !important;
} */
</style>