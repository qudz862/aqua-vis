<template>
  <div class="outer-container">
    <div class="title-layer">Cluster Evaluation View</div>
    <div class="svg-container">
      <svg id="co3Scatter" width=392 height=370 />
    </div>
    <!-- <img id="scatterAxis" src="" alt=""> -->
  </div>
</template>

<script>
import * as d3 from 'd3'
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import getData from '@/services'
import { RadarChart } from './radarChart2.js'
import { aqiColorScheme } from '@/data'

export default {
  name: 'CO3View',
  setup(props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    let svg
    let radarRegion
    let xCoord, yCoord
    let radiusList
    const width = 392
    const height = 370
    let legend
    // const colorList = ['00FF00', '#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const colorList = ['#01e400', d3.interpolateRdYlGn(0.9), '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const aqiColorScheme = d3.scaleLinear()
    //   .domain([0, 50, 100, 150, 200, 300, 500])
    //   .range(colorList)

    onMounted(() => {
      svg = d3.select("#co3Scatter")
              // .append('rect')
              // .attr('width', '100%')
              // .attr('height', '100%')
              // .attr('fill', 'pink')
    })

    function avg(array) {//封装求平均值函数
        var len = array.length;
        var sum = 0;
        for(var i = 0;i<len;i++){
            sum +=array[i];
        }
        return sum/len;
    }

    // 雷达图函数
    function radar(radar_region, center_data, center_aqi, getColor, label_num, getLen, var_names) {
      // console.log("radar");
      // 建立常量与多边形背景的数据
      const radius = 30, total = center_data[0].length, level = 5
      const rangeMin = 0, rangeMax = 500, arc = 2 * Math.PI
      const onePiece = arc / total
      let polygons = {
        webs: [],
        webPoints: []
      }
      for(let k = level; k > 0; k--) {
        let webs = '', webPoints = [];
        let r = radius / level * k;
        for(let i = 0; i < total; i++) {
          var x = r * Math.sin(i * onePiece),
          y = r * Math.cos(i * onePiece);
          webs += x + ',' + y + ' ';
          webPoints.push({
            x: x,
            y: y
          });
        }
        polygons.webs.push(webs);
        polygons.webPoints.push(webPoints);
      }

      // 绘制外圈圆
      let rings = radar_region.append('g')
            .attr('class', 'rings')
      for (let i = 0; i < rings._groups[0].length; ++i) {
        let ring = d3.select(rings._groups[0][i])
        ring.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', () => radius + getLen(label_num[i])/2)
            .attr('fill', '#fff')
            // .attr('opacity', 0)
            .attr('stroke', () => {
              let tmpAQI = center_aqi[i]
              if (tmpAQI >= 0 && tmpAQI <= 50) return getColor[0](tmpAQI)
              else if (tmpAQI > 50 && tmpAQI <= 150) return getColor[1](tmpAQI)
              else if (tmpAQI > 150 && tmpAQI <= 200) return getColor[2](tmpAQI)
              else if (tmpAQI > 200 && tmpAQI <= 300) return getColor[3](tmpAQI)
              else if (tmpAQI > 300) return getColor[4](tmpAQI)
            })
            .attr('stroke-width', () => getLen(label_num[i]))
      }

      // 绘制网轴
      let webs = radar_region.append('g')
        .classed('webs', true);
      webs.selectAll('polygon')
        .data(polygons.webs)
        .enter()
        .append('polygon')
        .attr('points', (d) => d)
        .attr('fill', (d,i) => {
          if (i % 2 === 1) return '#eaeded'
          else return '#d2d5d5'
        })
        // .attr('fill-opacity', 0.5)
        .attr('stroke', 'gray')
        // .attr('stroke-dasharray', "8, 2")
      
      // 添加纵轴
      let lines = radar_region.append('g')
        .classed('lines', true);
      lines.selectAll('line')
        .data(polygons.webPoints[0])
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', d => d.x)
        .attr('y2', d => d.y)
        .attr('stroke-width', 1)
        .attr('stroke', '#ababab')
        .attr('stroke-dasharray', "4, 2")

      // 计算雷达图表的坐标
      let areasDataGlobal = []
      let values = center_data;

      for (let i = 0; i < values.length; i++) {
        let areasData;
        // for (let j = 0; j < values[i].length; ++j) {
        let value = values[i], 
            area = '', 
            points = []
        for (let k = 0; k < total; k++) {
          let r = radius * (value[k] - rangeMin)/(rangeMax - rangeMin);
          let x = r * Math.sin(k * onePiece),
          y = r * Math.cos(k * onePiece);
          area += x + ',' + y + ' ';
          points.push({
            x: x,
            y: y
          })
        }
        areasData = {
          polygon: area,
          points: points
        };
        // }
        areasDataGlobal.push(areasData)
      }
      // console.log(areasDataGlobal);

      // 添加g分组包含所有雷达图区域
      let areas = radar_region.append('g')
        .attr('class', 'areas');
      // console.log(areas);
      for (let i = 0; i < areas._groups[0].length; ++i) {
        // let one_area = d3.select('.areas:nth-child('+ i +')')
        let one_area = d3.select(areas._groups[0][i])
        // console.log(one_area);
        one_area.append('g').attr('class', 'area' + (1));
        
        let area = one_area.select('.area' + (1)), areaData = areasDataGlobal[i];
        area.append('polygon')
          .attr('points', areaData.polygon)
          .attr('stroke', (d) => {
            let tmpAQI = center_aqi[i]
            if (tmpAQI >= 0 && tmpAQI <= 50) return getColor[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) return getColor[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) return getColor[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) return getColor[3](tmpAQI)
            else if (tmpAQI > 300) return getColor[4](tmpAQI)
          })
          // .attr('stroke-width', 2)
          .attr('fill', (d) => {
            let tmpAQI = center_aqi[i]
            if (tmpAQI >= 0 && tmpAQI <= 50) return getColor[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) return getColor[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) return getColor[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) return getColor[3](tmpAQI)
            else if (tmpAQI > 300) return getColor[4](tmpAQI)
          })
          .attr('opacity', 0.8)
        
        // 绘制雷达图区域下的点
        // let circles = area.append('g')
        //   .classed('circles', true);
        // circles.selectAll('circle')
        //   .data(areaData.points)
        //   .enter()
        //   .append('circle')
        //   .attr('cx', d => d.x)
        //   .attr('cy', d => d.y)
        //   .attr('r', 3)
        //   .attr('stroke', (d) => getColor(center_aqi[i]))
      }

      // // 计算文字标签坐标
      // let textPoints = [];
      // let textRadius = radius+5;
      // for(let i = 0; i < total; i++) {
      // let x = textRadius * Math.sin(i * onePiece),
      //   y = textRadius * Math.cos(i * onePiece);
      // textPoints.push({
      //   x: x,
      //   y: y
      // });
      // }
      // // 绘制文字标签
      // let texts = radar_region.append('g')
      //   .classed('texts', true);
      // texts.selectAll('text')
      //   .data(textPoints)
      //   .enter()
      //   .append('text')
      //   .attr('text-anchor', 'middle')
      //   .attr('x', d => d.x)
      //   .attr('y', d => d.y)
      //   .attr('font-size', 10)
      //   .text((d,i) => var_names[i])
    }

    function cluterHandle () {
      for (let i = 0; i < xCoord.length; ++i) {
        for (let j = i + 1; j < xCoord.length; ++j) {
          let dis = distance(xCoord[i], yCoord[i], xCoord[j], yCoord[j])
          let rDis = radiusList[i] + radiusList[j]
          if (dis < rDis) {
            // 需要对遮挡进行处理
            let xRate = Math.abs(xCoord[i] - xCoord[j]) / dis
            let yRate = Math.abs(yCoord[i] - yCoord[j]) / dis
            let xMove = (rDis - dis) * xRate
            let yMove = (rDis - dis) * yRate
            // console.log(xMove, yMove);
            let xFlag = 1, yFlag = 1
            if (xCoord[i] < xCoord[j]) xFlag = -1
            if (yCoord[i] < yCoord[j]) yFlag = -1
            let xPosProp1 = xFlag > 0 ? ((width - xCoord[i]) / width) : (xCoord[i] / width), xPosProp2 = xFlag > 0 ? (xCoord[j] / width) : ((width - xCoord[j]) / width), xPosPropMid = Math.abs(xCoord[i] - xCoord[j]) / width
            let yPosProp1 = yFlag > 0 ? ((height - yCoord[i]) / height) : (yCoord[i] / height), yPosProp2 = yFlag > 0 ? (yCoord[j] / height) : ((height - yCoord[j]) / height), yPosPropMid = Math.abs(yCoord[i] - yCoord[j]) / height
            // console.log(xPosProp1+xPosProp2+xPosPropMid);
            // console.log(yPosProp1+yPosProp2+yPosPropMid);
            
            let xPlus = xFlag > 0 ? xCoord[i] : xCoord[j]
            let xMinus = xFlag > 0 ? xCoord[j] : xCoord[i]
            let yPlus = yFlag > 0 ? yCoord[i] : yCoord[j]
            let yMinus = yFlag > 0 ? yCoord[j] : yCoord[i]

            xCoord[i] += xFlag * xMove * (xPosProp1 + xPosPropMid * 0.5)
            xCoord[j] -= xFlag * xMove * (xPosProp2 + xPosPropMid * 0.5)
            yCoord[i] += yFlag * yMove * (yPosProp1 + yPosPropMid * 0.5)
            yCoord[j] -= yFlag * yMove * (yPosProp2 + yPosPropMid * 0.5)

            for (let k = 0; k < xCoord.length; ++k) {
              if (k === i || k === j) continue
              if (xCoord[k] <= xPlus && xCoord[k] >= xMinus) {
                let xMinusRate = (xCoord[k] - xMinus) / (xPlus - xMinus)
                xCoord[k] = xFlag > 0 ? (xCoord[j] + (xCoord[i] - xCoord[j]) * xMinusRate) : (xCoord[i] + (xCoord[j] - xCoord[i]) * xMinusRate)
              }
              else if (xCoord[k] > xPlus) {
                if (xCoord[k] - xPlus < radiusList[k]) {
                  let xMinusRate = (xPlus - xMinus) / (xCoord[k] - xMinus)
                  xCoord[k] = xFlag > 0 ? (xCoord[j] + (xCoord[i] - xCoord[j]) / xMinusRate) : (xCoord[i] + (xCoord[j] - xCoord[i]) / xMinusRate)
                }
                else {
                  let xBorderRate = (xCoord[k] / width)
                  let xPlusMove = xFlag > 0 ? xMove * (xPosProp1 + xPosPropMid * 0.5) : xMove * (xPosProp2 + xPosPropMid * 0.5)
                  xCoord[k] += xPlusMove * (1 - xBorderRate)
                }
              }
              else if (xCoord[k] < xMinus) {
                if (xMinus - xCoord[k] < radiusList[k]) {
                  let xPlusRate = (xPlus - xMinus) / (xPlus - xCoord[k])
                  xCoord[k] = xFlag > 0 ? (xCoord[i] - (xCoord[i] - xCoord[j]) / xPlusRate) : (xCoord[j] - (xCoord[j] - xCoord[i]) / xPlusRate)
                }
                else {
                  let xBorderRate = (xCoord[k] / width)
                  let xMinusMove = xFlag < 0 ? xMove * (xPosProp1 + xPosPropMid * 0.5) : xMove * (xPosProp2 + xPosPropMid * 0.5)
                  xCoord[k] -= xMinusMove * xBorderRate
                }
              }

              if (yCoord[k] <= yPlus && yCoord[k] >= yMinus) {
                let yMinusRate = (yCoord[k] - yMinus) / (yPlus - yMinus)
                yCoord[k] = yFlag > 0 ? (yCoord[j] + (yCoord[i] - yCoord[j]) * yMinusRate) : (yCoord[i] + (yCoord[j] - yCoord[i]) * yMinusRate)
              }
              else if (yCoord[k] > yPlus) {
                if (yCoord[k] - yPlus < radiusList[k]) {
                  let yMinusRate = (yPlus - yMinus) / (yCoord[k] - yMinus)
                  yCoord[k] = yFlag > 0 ? (yCoord[j] + (yCoord[i] - yCoord[j]) / yMinusRate) : (yCoord[i] + (yCoord[j] - yCoord[i]) / yMinusRate)
                }
                else {
                  let yBorderRate = (yCoord[k] / height)
                  let yPlusMove = yFlag > 0 ? yMove * (yPosProp1 + yPosPropMid * 0.5) : yMove * (yPosProp2 + yPosPropMid * 0.5)
                  yCoord[k] += yPlusMove * (1 - yBorderRate)
                }
              }
              else if (yCoord[k] < yMinus) {
                if (yMinus - yCoord[k] < radiusList[k]) {
                  let yPlusRate = (yPlus - yMinus) / (yPlus - yCoord[k])
                  yCoord[k] = yFlag > 0 ? (yCoord[i] - (yCoord[i] - yCoord[j]) / yPlusRate) : (yCoord[j] - (yCoord[j] - yCoord[i]) / yPlusRate)
                }
                else {
                  let yBorderRate = (yCoord[k] / height)
                  let yMinusMove = yFlag < 0 ? yMove * (yPosProp1 + yPosPropMid * 0.5) : yMove * (yPosProp2 + yPosPropMid * 0.5)
                  yCoord[k] -= yMinusMove * yBorderRate
                }
              }
            }
          }
        }
      }

      for (let i = 0; i < xCoord.length; ++i) {
        if (xCoord[i] + radiusList[i] > width) xCoord[i] = width - radiusList[i]
        if (xCoord[i] - radiusList[i] < 0) xCoord[i] = radiusList[i]
        if (yCoord[i] + radiusList[i] > height) yCoord[i] = height - radiusList[i]
        if (yCoord[i] - radiusList[i] < 0) yCoord[i] = radiusList[i]
      }
    }

    function violin(radar_region, center_data, center_aqi, getColor, label_num, getLen, var_names, cluster_distribution, max_iaqi) {
      const radius = 70, total = center_data[0].length, level = 5, realRadius = 35
      const rangeMin = 0, rangeMax = 500, arc = 2 * Math.PI
      const onePiece = arc / total

      const margin = {top: 0, right: 0, bottom: 0, left: 0}
      const color = d3.scaleOrdinal().range(["#00A0B0","#EDC951","#CC333F"]);
      
      // 绘制外圈圆
      let rings = radar_region.append('g')
            .attr('class', 'rings')
      for (let i = 0; i < rings._groups[0].length; ++i) {
        let ring = d3.select(rings._groups[0][i])
        ring.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', () => realRadius + getLen(label_num[i])/2)
            .attr('fill', '#fff')
            // .attr('opacity', 0)
            .attr('stroke', () => {
              let tmpAQI = center_aqi[i]
              if (tmpAQI >= 0 && tmpAQI <= 50) return getColor[0](tmpAQI)
              else if (tmpAQI > 50 && tmpAQI <= 150) return getColor[1](tmpAQI)
              else if (tmpAQI > 150 && tmpAQI <= 200) return getColor[2](tmpAQI)
              else if (tmpAQI > 200 && tmpAQI <= 300) return getColor[3](tmpAQI)
              else if (tmpAQI > 300) return getColor[4](tmpAQI)
            })
            .attr('stroke-width', () => getLen(label_num[i]))
      }

      let data = []
      for (let i = 0; i < center_data.length; ++i) {
        let tmp_data = [[]]
        for (let j = 0; j < total; ++j) {
          let tmp_obj = { axis: var_names[j], value: center_data[i][j] }
          tmp_data[0].push(tmp_obj)
        }
        data.push(tmp_data)
      }
      // console.log(data);

			//Call function to draw the Radar chart
      for (let i = 0; i < center_data.length; ++i) {
        const radarChartOptions = {
			  w: radius,
			  h: radius,
			  margin: margin,
			  maxValue: rangeMax,
			  levels: level,
			  roundStrokes: true,
			  color: getColor,
        aqi: center_aqi[i]
			};
        RadarChart(".radar" + (i), data[i], radarChartOptions);
      }

      // 添加最大值标记
      let vinlinHeight = document.getElementsByClassName('gridCircle')[0].getAttribute('r') * 1;
      const maxScale = d3.scaleLinear().domain([0, 500]).range([5, vinlinHeight])
      let axisWrapper = d3.selectAll('.axisWrapper')
      for (let i = 0; i < cluster_distribution.length; ++i) {
        let cluster_max = max_iaqi[i]
        // console.log(cluster_dis_verteces);
        let oneAxisWrapper = d3.select(axisWrapper._groups[0][i])
        // 轴上画小提琴图
        let axisg = oneAxisWrapper.selectAll('.axis')
            .append('rect')
            .attr('x', -3)
            .attr('y', (d,index) => maxScale(cluster_max[index]))
            .attr('width', 6)
            .attr('height', 2)
            .attr('fill', (d,index) => {
              let tmpAQI = cluster_max[index]
              if (tmpAQI >= 0 && tmpAQI <= 50) return getColor[0](tmpAQI)
              else if (tmpAQI > 50 && tmpAQI <= 150) return getColor[1](tmpAQI)
              else if (tmpAQI > 150 && tmpAQI <= 200) return getColor[2](tmpAQI)
              else if (tmpAQI > 200 && tmpAQI <= 300) return getColor[3](tmpAQI)
              else if (tmpAQI > 300) return getColor[4](tmpAQI)
            })
            .attr("transform",function(d,index){
              var jiaodu = 180 + 360 / total * index;
              return("rotate("+jiaodu+")");
            });
      }

      // 添加分布信息
      // function kernelDensityEstimator(kernel, x) {
      //   return function(sample) {
      //     return x.map(function(x) {
      //     return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
      //     });
      //   };
      // }

      // function epanechnikovKernel(scale) {
      //   return function(u) {
      //     return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
      //   };
      // }

      // let vinlinHeight = document.getElementsByClassName('gridCircle')[0].getAttribute('r') * 1;
      // // console.log(vinlinHeight);
      // // 还是用x表示轴长，y表示轴宽
      // const violinWidth = 15;
      // const x = d3.scaleLinear().domain([5, 69]).range([5, vinlinHeight])
      // const y = d3.scaleLinear().domain([0, 1]).range([violinWidth, 0])
      // const violin = d3.area()
      //     .x0((d,i) => y(d[1])-violinWidth)
      //     .x1((d,i) => -y(d[1])+violinWidth)
      //     .y((d,i) => x(d[0]))
      // const kde = kernelDensityEstimator(epanechnikovKernel(7), x.ticks(30))
      // let axisWrapper = d3.selectAll('.axisWrapper')
      // // console.log(axisWrapper);
      // for (let i = 0; i < cluster_distribution.length; ++i) {
      //   let cluster_dis = cluster_distribution[i]
      //   let cluster_dis_verteces = []
      //   for (let j = 0; j < cluster_distribution[i].length; ++j) {
      //     let one_verteces_list = []
      //     for (let k = 0; k < cluster_distribution[i][j].length; ++k) {
      //       let tmpItem = [k+5, cluster_distribution[i][j][k]]
      //       one_verteces_list.push(tmpItem)
      //     }
      //     cluster_dis_verteces.push(one_verteces_list)
      //   }
      //   // console.log(cluster_dis_verteces);
      //   let oneAxisWrapper = d3.select(axisWrapper._groups[0][i])
      //   // 轴上画小提琴图
      //   let axisg = oneAxisWrapper.selectAll('.axis')
      //       .append('g').attr('id',(d,i) => 'box'+i)
      //   axisg.append("path")
      //     .data(cluster_dis_verteces)
      //     .attr("class", "violin")
      //     .attr("d", (d,i) => {
      //       // console.log(d);
      //       // console.log(violin(d));
      //       return violin(d)
      //     })
      //     .attr("transform",function(d,i){
      //         var jiaodu = 180 + 360 / total * i;
      //       //var jiaodu = 45*180 / Math.PI ; 
      //       return("rotate("+jiaodu+")");
      //       //   return("rotate(90deg)")
      //       //   return ("translate(" + (document.getElementsByClassName('line')[i].getAttribute('x2')) + "," + (document.getElementsByClassName('line')[i].getAttribute('y2')) + ")rotate(0)")
      //   });
      // }
    }

    const distance = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

    function drawLegend () {
      let legendScale = d3.scaleLinear().domain([0, 90]).range([0, 500])
      legend = svg.append('g')
      legend.selectAll('rect').data(d3.range(90)).enter()
            .append('rect')
            .attr('x', (d,i) => {
              // console.log(d,i);
              return 24+i*2
            })
            .attr('y', 2)
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
            .attr('y', 14)
      legend.append('text')
            .attr('text-anchor', 'middle')
            .text('500')
            .attr("font-size", '14')
            .attr('x', 220)
            .attr('y', 14)
    }

    watch (() => stateObj.clusteringResult, (oldVlaue, newValue) => {
      // 6种污染等级颜色：绿、黄、橙、红、紫、褐红  -> d3.interpolateRdYlGn(t)
      // console.log(stateObj.clusteringResult);
      $("#co3Scatter").empty();
      const clusterInfo = stateObj.clusteringResult['cluster_info']
      // const pointCenter = clusterInfo.centers
      const concVal = clusterInfo.concentration
      const concShift = 0.1 * avg(concVal)
      const concScale = d3.scaleLinear()
        .domain([Math.min(...concVal) - concShift, Math.max(...concVal) + concShift])
        .range([0, width])
      // const concAxis = d3.axisBottom(concScale)

      const contVal = clusterInfo.continuity
      const contShift = 0.03 * avg(contVal)
      const contScale = d3.scaleLinear()
        .domain([Math.min(...contVal) - contShift, Math.max(...contVal) + contShift])
        .range([height, 0])
      // const contAxis = d3.axisLeft(contScale)

      const labelNum = clusterInfo.label_num
      const lenScale = d3.scaleLinear()
        .domain([Math.min(...labelNum), Math.max(...labelNum)])
        .range([1,11])

      xCoord = [], yCoord = []
      for (let i = 0; i < contVal.length; ++i) {
        xCoord.push(concScale(concVal[i]))
        yCoord.push(contScale(contVal[i]))
      }
      radiusList = []
      for (let i = 0; i < labelNum.length; ++i) {
        radiusList.push(lenScale(labelNum[i]) + 35)
      }
      // console.log(radiusList);
      // 遮挡检测……
      cluterHandle()
      cluterHandle()
      cluterHandle()

      const centerAQI = clusterInfo.centers.map(val => Math.max(...val))
      const colorScale = d3.scaleLinear()
        .domain([0, 500])
        .range([1,0])

      // const colorList = ['#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
      // const aqiColorScheme = d3.scaleThreshold()
      //   .domain([50, 100, 150, 200, 300])
      //   .range(colorList)

      // 加了坐标轴感觉不好看…… 感觉不如直接加一个指示坐标轴的图注
      // svg.append("g")
      //         .attr("transform", "translate(20, 360)")
      //         .call(concAxis)
      //         .selectAll('.tick')
      //         .remove()
      // svg.append("g")
      //         .attr("transform", "translate(20, 0)")
      //         .call(contAxis)
      //         .selectAll('.tick')
      //         .remove()
      
      // 尝试1：每个点画圆，半径表示类中样本数目，颜色表示污染程度
      // svg.selectAll('.clusterGlyph')
      //    .data(clusterInfo.centers)
      //    .enter().append('g')
      //    .append('circle')
      //    .attr('cx', (d,i) => concScale(concVal[i]))
      //    .attr('cy', (d,i) => contScale(contVal[i]))
      //    .attr('r', (d,i) => lenScale(labelNum[i])*10+2)
      //    .attr('fill', (d,i) => aqiColorScheme(centerAQI[i]))
      
      // 尝试2：每个点画雷达图，半径一致，外圈画一个圆环，圆环宽度表示样本数目，颜色表示污染程度
      radarRegion = svg.selectAll(".radar")
                .data(clusterInfo.centers)
                .enter().append("g")
                .attr("class", (d,i) => "radar"+(i)) 
                .attr("transform", (d,i) => "translate(" + xCoord[i] + "," + yCoord[i] + ")")
      const allVarNames = ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3']
      const varNames = []
      for (let i = 0; i < allVarNames.length; ++i) {
        if (stateObj.valFlag[i] === 1) varNames.push(allVarNames[i])
      }
      // radar(radarRegion, clusterInfo.centers, centerAQI, aqiColorScheme, clusterInfo.label_num, lenScale, varNames)
      violin(radarRegion, clusterInfo.centers, centerAQI, aqiColorScheme, clusterInfo.label_num, lenScale, varNames, clusterInfo['iaqi_distribution'], clusterInfo['iaqi_max'])  
      radarRegion.on("mouseover", (e,d) => {
        for (let i = 0; i < clusterInfo.centers.length; ++i) {
          if (d[0] === clusterInfo.centers[i][0]) {
            let tmpColor
            let tmpAQI = centerAQI[i]
            if (tmpAQI >= 0 && tmpAQI <= 50) tmpColor = aqiColorScheme[0](tmpAQI)
            else if (tmpAQI > 50 && tmpAQI <= 150) tmpColor = aqiColorScheme[1](tmpAQI)
            else if (tmpAQI > 150 && tmpAQI <= 200) tmpColor = aqiColorScheme[2](tmpAQI)
            else if (tmpAQI > 200 && tmpAQI <= 300) tmpColor = aqiColorScheme[3](tmpAQI)
            else if (tmpAQI > 300) tmpColor = aqiColorScheme[4](tmpAQI)
            store.commit('setData', {
              field: 'sel_cluster_id',
              data: {'id': i, 'level': tmpColor}
            })
            break
          }
        }
        // console.log(stateObj.selClusterID);
      }).on("mouseout", (e,d) => {
        store.commit('setData', {
          field: 'sel_cluster_id',
          data: {'id': -1, 'level': -1}
        })
        // console.log(stateObj.selClusterID);
      })

      // 画colorbar（可省略）
      drawLegend()
      // let colorLegend = svg.append('g').attr('class', 'colorLegend')
      // colorLegend.append('g').selectAll('rect')
      //       .data(colorList).enter()
      //       .append('rect')
      //       .attr('x', (d,i) => {
      //         let m = 12 + i * 38
      //         if (i == 2) m -= 4
      //         if (i > 1) m += 6 * i
      //         return m
      //       })
      //       .attr('y', 0)
      //       .attr('width', 16)
      //       .attr('height', 12)
      //       .attr('fill', (d,i) => d)
      // const colorTextList = ["0~50", "50~100", "100~150", "150~200", "200~300", "300~500"]
      // colorLegend.append('g').selectAll('text')
      //       .data(colorTextList).enter()
      //       .append('text')
      //       .attr('text-anchor', 'middle')
      //       .attr('x', (d,i) => {
      //         let m = 19 + i * 38
      //         if (i == 2) m -= 5
      //         if (i > 1) m += 6.5 * i
      //         return m
      //       })
      //       .attr('y', 22)
      //       .attr('font-size', 10)
      //       .text((d,i) => d)

      // const axisLegend = svg.append('g').attr('class', 'axisLegend')
      // const axisTextList = ['concentration', 'continuity']
      // axisLegend.append('g').selectAll('line')
      //       .data(axisTextList).enter()
      //       .append('line')
    })
  }
}
</script>

<style scoped>
.outer-container {
  width: 420px;
  height: 420px;
  border: solid 1px #c2c5c5;
  border-radius: 6px;
  /* padding: 1px; */
  margin: 2px;
}

.svg-container {
  width: 419px;
  height: 396px;
  display: flex;
  /* justify-content: center; */
  /* align-items: center; */
  padding: 6px 4px 20px 23px;
  background-image: url(../../assets/legends/scatter_axis.png);
  background-repeat: no-repeat;
}

.title-layer {
  /* position: absolute; */
  z-index: 80;
  width: 419px;
  height: 24px;
  text-align: left;
  padding-left: 12px;
  /* background-color: #6c757d; */
  color: #333;
  /* color: #fff; */
  word-spacing: 2px;
}

#scatterAxis {
  /* display: inline-block; */
  position: fixed;
  top: 10;
  width: 60px;
  height: 60px;
}

</style>