<template>
  <div class="outer-container">
    <div class="title-layer">Spatio-Temporal Distribution View</div>
    <div class="svg-container">
      <svg id="distributionMtx" width=620 height=380 />
    </div>
  </div>
</template>


<script>
import * as d3 from 'd3'
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import getData from '@/services'
import { aqiColorScheme } from '@/data'

export default {
  name: 'DistributionView',
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    let svg
    const width = 620
    const height = 380
    let cityListOrder = []
    let selCityLocsOrder = []
    let orderNames = []
    // const colorList = ['#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const colorList = [d3.interpolateRdYlGn(1), d3.interpolateRdYlGn(0.6), d3.interpolateRdYlGn(0.4), d3.interpolateRdYlGn(0.3), d3.interpolateRdYlGn(0.2), d3.interpolateRdYlGn(0.1), d3.interpolateRdYlGn(0)]
    // const colorList = ['#01e400', d3.interpolateRdYlGn(0.9), '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const colorList = ['00FF00', '#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const aqiColorScheme = d3.scaleLinear()
    //   .domain([0, 50, 100, 150, 200, 300, 500])
    //   .range(colorList)
    
    let totalDistribution = []
    let totalAccuDistribution = []
    let centerAQI
    let centerInfor
    let clusterNum

    onMounted(() => {
      svg = d3.select("#distributionMtx")
    })
    
    function arr_sum(array) {//封装求和函数
        var len = array.length;
        var sum = 0;
        for(var i = 0; i < len; i++){
            sum +=array[i];
        }
        return sum;
    }
    
    function asc(a, b) {
      return a['AQI'] - b['AQI'];
    }

    function getOrderLevelID (oldID) {
      let newID = -1
      for (let i = 0; i < stateObj.clusterNum; ++i) {
        if (oldID === centerInfor[i]['original_id']) newID = i
      }
      return newID
    }

    function clusterView (clusterID, stDistribution, names, color) {
      const cityNum = stDistribution[0].length
      const weekNum = stDistribution[0][0].length
      let weekValList = []
      let showWeekList = []
      for (let i = 0; i < weekNum; ++i) {
        // let weekVal = `week${weekNum+1}`
        if (i % 2 === 0) {
          showWeekList.push(i)
        }
        weekValList.push(i)
      }
      let cityDistribution = []
      let weekDistribution = []
      for (let i = 0; i < stDistribution.length; ++i) {
        cityDistribution.push([])
        weekDistribution.push([])
        for (let j = 0; j < weekNum; ++j) {
          weekDistribution[i].push(0)
        }
        for (let j = 0; j < cityNum; ++j) {
          let citySum = 0
          for (let k = 0; k < weekNum; ++k) {
            citySum += stDistribution[i][j][k]
            weekDistribution[i][k] += stDistribution[i][j][k]
          }
          cityDistribution[i].push(citySum)
        }
      }
      // console.log(cityDistribution);
      // console.log(weekDistribution);

      const outerBarLength = 30
      const x = d3.scaleLinear()
        .domain([0, weekNum])
        .range([40, width-outerBarLength])
      // const y = d3.scaleBand()
      //   .domain(names)
      //   .rangeRound([outerBarLength, height-18])
      const yTop = outerBarLength, yBottom = height-18
      const yBand = (yBottom - yTop) / names.length
      // if (yBand < 7) yBand = 7
      
      const y = d3.scaleBand()
        .domain(names)
        .range([outerBarLength, height-18])
      // console.log(outerBarLength, height-18);
      // for (let i = 0; i < names.length; ++i) {
      //   console.log(y(names[i]));
      // }
      const opacityScale = d3.scaleLinear()
        .domain([0, 7])
        .range([0, 1])  
      
      const xShift = 14

      let xAxis = g => g
        .call(g => g.append("g")
          // .attr("transform", `translate(0,${margin.top})`)
          .call(d3.axisTop(x).ticks(null, "d"))
          .call(g => g.select(".domain").remove()))
        .call(g => g.append("g")
          .attr("transform", `translate(5,${height-16})`)
          .call(d3.axisBottom(x)
              .tickValues(showWeekList)
              .tickFormat(x => `${x+1}`)
              .tickSize(0))
          .call(g => g.select(".domain").remove()));
      let yAxis = g => g
        .attr("transform", `translate(40,0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove())
      svg.append("g").call(xAxis);
      svg.append("g").call(yAxis);

      svg.append("g")
        .selectAll("g")
        .data(stDistribution[clusterID])
        .join("g")
          .attr("transform", (d, i) => `translate(0, ${yTop + yBand * i})`)
        .selectAll("rect")
        .data((d,i) => d)
        .join("rect")
          .attr("x", (d, i) => x(weekValList[i]) + 1).attr("y", (d,i) => (yBand - 1) / 7 * (7-d))
          .attr("width", (d, i) => x(weekValList[i] + 1) - x(weekValList[i]) - 1)
          .attr("height", (d,i) => (yBand - 1) / 7 * d)
          .attr("fill", color)
          // .attr('stroke', "#333")
          .attr("opacity", (d, i) => opacityScale(d))
      
      svg.append("g")
      for (let i = 0; i < cityNum; ++i) {
        svg.append('line')
          .attr('x1', 39).attr('x2', width-outerBarLength+1)
          .attr('y1', yTop + yBand * i)
          .attr('y2', yTop + yBand * i)
          .attr('stroke', (d) => i === 0 ? '#999':'#dedede')
          .attr('stroke-width', '1px')
      }
      svg.append('line')
          .attr('x1', 39).attr('x2', width-outerBarLength+1)
          .attr('y1', yTop + yBand * cityNum)
          .attr('y2', yTop + yBand * cityNum)
          .attr('stroke', '#999')
          .attr('stroke-width', '1px')
           
      svg.append("g")
      for (let i = 0; i < weekNum; ++i) {
        svg.append('line')
          .attr('x1', x(weekValList[i]))
          .attr('x2', x(weekValList[i]))
          .attr('y1', outerBarLength).attr('y2', height-18)
          .attr('stroke', (d) => i === 0 ? '#999':'#dedede')
          .attr('stroke-width', '1px')
      }
      svg.append('line')
          .attr('x1', x(weekValList[weekNum-1]) + x(weekValList[0] + 1) - x(weekValList[0]))
          .attr('x2', x(weekValList[weekNum-1]) + x(weekValList[0] + 1) - x(weekValList[0]))
          .attr('y1', yTop).attr('y2', yBottom)
          .attr('stroke', '#999')
          .attr('stroke-width', '1px')
      if (cityNum > 40) {
        svg.selectAll('text').attr('font-size', '8px')
      }

      // 画外侧柱
      let weekMaxList = [], cityMaxList = []
      for (let i = 0; i < weekDistribution.length; ++i) {
        weekMaxList.push(Math.max(...weekDistribution[i]))
        cityMaxList.push(Math.max(...cityDistribution[i]))
      }
      const weekScale = d3.scaleLinear()
        .domain([0, Math.max(...weekMaxList)])
        .range([outerBarLength, 0])
      const cityScale = d3.scaleLinear()
        .domain([0, Math.max(...cityMaxList)])
        .range([0, outerBarLength])

      svg.append('g').selectAll('rect')
        .data(weekDistribution[clusterID])
        .enter().append('rect')
        .attr('x', (d, i) => x(weekValList[i]) + 1)
        .attr('y', (d, i) => weekScale(d))
        .attr('width', (d, i) => x(weekValList[i] + 1) - x(weekValList[i]) - 1)
        .attr('height', (d, i) => outerBarLength - weekScale(d))
        .attr('fill', '#999')
        .attr('stroke', 'dedede')
      svg.append('g').selectAll('rect')
        .data(cityDistribution[clusterID])
        .enter().append('rect')
        .attr('x', width-outerBarLength)
        .attr('y', (d, i) => outerBarLength + yBand * i + 1)
        .attr('width', (d, i) => cityScale(d))
        .attr('height', yBand - 1)
        .attr('fill', '#999')
        .attr('stroke', 'dedede')

        // 坐标轴名称
        const axisName = svg.append('g')
        axisName.append('text')
                .attr('x', width-30).attr('y', height-6)
                .attr('font-size', '10px')
                .text('Week')
        axisName.append('text')
                .attr('x', 16).attr('y', 25)
                .attr('font-size', '10px')
                .text('City')

        // 画图例
        const legend = svg.append('g')
        for (let i = 1; i <= 7; ++i) {
          legend.append('rect')
            .attr('x', (2+i*12)).attr('y', 0)
            .attr('width', 10).attr('height', 10)
            .attr('fill', color)
            .attr('stroke', '#dedede')
            .attr('fill-opacity', opacityScale(i))
          legend.append('text')
            .attr('x', (2+i*12+2.5))
            .attr('y', 8)
            .attr('font-size', '8px')
            .text(i)
            .attr('fill', (d) => {
              if (i > 5) return '#fff'
              else return '#333'
            })
        }

    }

    function totalView (totalDistribution, names, clusterNum, centers) {
      const cityNum = totalDistribution.length
      const weekNum = totalDistribution[0].length
      clusterNum = stateObj.clusterNum
      // const aqiColorScheme = d3.scaleThreshold()
      // .domain([50, 100, 150, 200, 300])
      // .range(colorList)
      console.log(cityNum, weekNum);
      let weekValList = []
      let showWeekList = []
      for (let i = 0; i < weekNum; ++i) {
        // let weekVal = `week${weekNum+1}`
        if (i % 2 === 0) {
          showWeekList.push(i)
        }
        weekValList.push(i)
      }
      let cityDistribution = []
      let weekDistribution = []
      for (let i = 0; i < weekNum; ++i) {
        weekDistribution.push([])
        for (let j = 0; j < clusterNum; ++j) {
          weekDistribution[i].push([0, 0])
        }
      }
      for (let i = 0; i < cityNum; ++i) {
        cityDistribution.push([])
        for (let j = 0; j < clusterNum; ++j) {
          cityDistribution[i].push([0, 0])
        }
        for (let j = 0; j < weekNum; ++j) {
          for (let k = 0; k < clusterNum; ++k) {
            cityDistribution[i][k][0] += totalDistribution[i][j][k][0]
            cityDistribution[i][k][1] += totalDistribution[i][j][k][1]
            weekDistribution[j][k][0] += totalDistribution[i][j][k][0]
            weekDistribution[j][k][1] += totalDistribution[i][j][k][1]
          }
        }
      }

      const outerBarLength = 30
      const x = d3.scaleLinear()
        .domain([0, weekNum])
        .range([40, width-outerBarLength])
      // const y = d3.scaleBand()
      //   .domain(names)
      //   .rangeRound([outerBarLength, height-18])
      const yTop = outerBarLength, yBottom = height-18
      const yBand = (yBottom - yTop) / names.length
      // if (yBand < 7) yBand = 7
      
      const y = d3.scaleBand()
        .domain(names)
        .range([outerBarLength, height-18])
      // console.log(outerBarLength, height-18);
      // for (let i = 0; i < names.length; ++i) {
      //   console.log(y(names[i]));
      // }
      const opacityScale = d3.scaleLinear()
        .domain([0, 7])
        .range([0, 1])
      
      const xShift = 14

      let xAxis = g => g
        .call(g => g.append("g")
          // .attr("transform", `translate(0,${margin.top})`)
          .call(d3.axisTop(x).ticks(null, "d"))
          .call(g => g.select(".domain").remove()))
        .call(g => g.append("g")
          .attr("transform", `translate(5,${height-16})`)
          .call(d3.axisBottom(x)
              .tickValues(showWeekList)
              .tickFormat(x => `${x+1}`)
              .tickSize(0))
          .call(g => g.select(".domain").remove()));
      let yAxis = g => g
        .attr("transform", `translate(40,0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove())
      svg.append("g").call(xAxis);
      svg.append("g").call(yAxis);
     
      svg.append("g")
        .selectAll("g")
        .data(totalDistribution)
        .join("g")
          .attr("transform", (d, i) => `translate(0, ${yTop + yBand * i})`)
        .selectAll("g")
        .data((d,i) => d)
        .join("g")
          .attr("transform", (d, i) => `translate(${x(weekValList[i]) + 1}, 0)`)
        .selectAll('rect')
        .data((d,i) => d)
        .join('rect')
          .attr("x", 0).attr("y", (d,i) => (yBand - 1) / 7 * d[1])
          .attr("width", (d, i) => x(weekValList[i] + 1) - x(weekValList[i]) - 1)
          .attr("height", (d, i) => (yBand - 1) / 7 * d[0])
          .attr("fill", (d,i) => {
            let tmpAQI = centers[i]
            if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
            else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
          })
          // .attr('opacity', 0.8)

      svg.append("g")
      for (let i = 0; i < cityNum; ++i) {
        svg.append('line')
          .attr('x1', 39).attr('x2', width-outerBarLength+1)
          .attr('y1', yTop + yBand * i)
          .attr('y2', yTop + yBand * i)
          .attr('stroke', (d) => i === 0 ? '#999':'#dedede')
          .attr('stroke-width', '1px')
      }
      svg.append('line')
          .attr('x1', 39).attr('x2', width-outerBarLength+1)
          .attr('y1', yTop + yBand * cityNum)
          .attr('y2', yTop + yBand * cityNum)
          .attr('stroke', '#999')
          .attr('stroke-width', '1px')
           
      svg.append("g")
      for (let i = 0; i < weekNum; ++i) {
        svg.append('line')
          .attr('x1', x(weekValList[i]))
          .attr('x2', x(weekValList[i]))
          .attr('y1', outerBarLength).attr('y2', height-18)
          .attr('stroke', (d) => i === 0 ? '#999':'#dedede')
          .attr('stroke-width', '1px')
      }
      svg.append('line')
          .attr('x1', x(weekValList[weekNum-1]) + x(weekValList[0] + 1) - x(weekValList[0]))
          .attr('x2', x(weekValList[weekNum-1]) + x(weekValList[0] + 1) - x(weekValList[0]))
          .attr('y1', yTop).attr('y2', yBottom)
          .attr('stroke', '#999')
          .attr('stroke-width', '1px')
      if (cityNum > 40) {
        svg.selectAll('text').attr('font-size', '8px')
      }

      // 画外侧柱
      // console.log(weekDistribution);
      // console.log(cityDistribution);
      // const weekScale = d3.scaleLinear()
      //   .domain([0, cityNum * 7])
      //   .range([0, outerBarLength])
      // const cityScale = d3.scaleLinear()
      //   .domain([0, weekNum * 7])
      //   .range([0, outerBarLength])

      // svg.append('g').selectAll('g')
      //   .data(weekDistribution)
      //   .join('g')
      //     .attr("transform", (d, i) => `translate(${x(weekValList[i]) + 1}, 0)`)
      //   .selectAll('rect')
      //   .data((d,i) => d)
      //   .join('rect')
      //     .attr('x', 0)
      //     .attr('y', (d, i) => weekScale(d[1]))
      //     .attr('width', (d, i) => x(weekValList[i] + 1) - x(weekValList[i]) - 1)
      //     .attr('height', (d, i) => weekScale(d[0]))
      //     .attr('fill', (d, i) => aqiColorScheme(centers[i]))
      //     .attr('stroke', 'dedede')
      // svg.append('g').selectAll('g')
      //   .data(cityDistribution)
      //   .join('g')
      //      .attr("transform", (d, i) => `translate(0, ${outerBarLength + yBand * i + 1})`)
      //   .selectAll('rect')
      //   .data((d,i) => d)
      //   .join('rect')
      //     .attr('x', (d,i) => width-outerBarLength + cityScale(d[1]))
      //     .attr('y', 0)
      //     .attr('width', (d, i) => cityScale(d[0]))
      //     .attr('height', yBand - 1)
      //     .attr('fill', (d, i) => aqiColorScheme(centers[i]))
      //     .attr('stroke', 'dedede')

        // 坐标轴名称
        const axisName = svg.append('g')
        axisName.append('text')
                .attr('x', width-30).attr('y', height-6)
                .attr('font-size', '10px')
                .text('Week')
        axisName.append('text')
                .attr('x', 16).attr('y', 25)
                .attr('font-size', '10px')
                .text('City')

      //   // 画图例
      //   const legend = svg.append('g')
      //   for (let i = 1; i <= 7; ++i) {
      //     legend.append('rect')
      //       .attr('x', (2+i*12)).attr('y', 0)
      //       .attr('width', 10).attr('height', 10)
      //       .attr('fill', color)
      //       .attr('stroke', '#dedede')
      //       .attr('fill-opacity', opacityScale(i))
      //     legend.append('text')
      //       .attr('x', (2+i*12+2.5))
      //       .attr('y', 8)
      //       .attr('font-size', '8px')
      //       .text(i)
      //       .attr('fill', (d) => {
      //         if (i > 5) return '#fff'
      //         else return '#333'
      //       })
      //   }
    }

    watch (() => stateObj.selClusterID, (oldVlaue, newValue) => {
      $("#distributionMtx").empty();
      const st_distribution = stateObj.clusteringResult['st_distribution']
      if (stateObj.selClusterID.id === -1) {
        totalView(totalDistribution, orderNames, stateObj.clusterNum, centerAQI)
      } else {
        clusterView(stateObj.selClusterID.id, st_distribution, orderNames, stateObj.selClusterID.level)
      }
    })

    watch (() => stateObj.clusteringResult, (oldVlaue, newValue) => {
      $("#distributionMtx").empty();
      const clusterInfo = stateObj.clusteringResult['cluster_info']
      const st_distribution = stateObj.clusteringResult['st_distribution']
      // cityListOrder = stateObj.selCityList
      centerAQI = clusterInfo.centers.map(val => Math.max(...val))
      selCityLocsOrder = stateObj.clusteringResult['tsne_city_locs']
      // console.log(cityListOrder, selCityLocsOrder);
      selCityLocsOrder.sort(function(a,b){
        return parseFloat(a.mds_loc) - parseFloat(b.mds_loc)
      })
      orderNames = selCityLocsOrder.map(item => item.city) 
      // console.log(orderNames);
      
      totalDistribution = []
      let accu = []
      for (let i = 0; i < st_distribution[0].length; ++i) {
        totalDistribution.push([])
        accu.push([])
        
        for (let j = 0; j < st_distribution[0][0].length; ++j) {
          totalDistribution[i].push([])
          accu[i].push(0)
        }
      }

      for (let i = 0; i < st_distribution.length; ++i) {
        for (let j = 0; j < st_distribution[i].length; ++j) {
          for (let k = 0; k < st_distribution[i][j].length; ++k) {
            totalDistribution[j][k].push([st_distribution[i][j][k], accu[j][k]])
            // console.log([st_distribution[i][j][k], accu]);
            accu[j][k] += st_distribution[i][j][k]
          }
        }
      }
      // console.log(totalDistribution);
      centerInfor = []
      for (let i = 0; i < clusterNum; ++i) {
        centerInfor.push({'point': clusterInfo.centers[i], 'AQI': centerAQI[i], 'original_id': i})
      }
      centerInfor.sort(asc)

      totalView(totalDistribution, orderNames, stateObj.clusterNum, centerAQI)
    })

  }
}
</script>

<style scoped>
.outer-container {
  width: 638px;
  height: 420px;
  border: solid 1px #666;
  /* padding: 1px; */
  margin: 1px;
}

.title-layer {
  /* position: absolute; */
  z-index: 80;
  width: 637px;
  height: 24px;
  text-align: left;
  padding-left: 12px;
  background-color: #6c757d;
  color: #fff;
}

.svg-container {
  height: 396px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: -3px;
  padding-right: 3px;
}

</style>