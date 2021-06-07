<template>
  <div class="outer-container">
    <div class="title-layer">Pattern Evolution View</div>
    <div class="inner-container">
      <div class="svg-container">
        <svg id="evolutionFlow" />
      </div>
      <div class="patterSelRegion">
        <div class="config-title">
          <span class="iconfont">&#xe663;</span> Flow Patterns
        </div>
      </div>
    </div>
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
  name: 'EvolutionView',
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    const allVarNames = ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3']
    const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    let varNames
    let svg
    let radarContainer
    let radarRegion
    let circleRegion
    const width = 1348
    const height = 618
    const timeBarHeight = 60
    const timeAxisHeight = 40
    const patternRegionWidth = 314
    const radarRegionWidth = 90
    const flowRegionWidth = width - radarRegionWidth
    const dayPerScreen = 14
    let chartHeight = height - timeBarHeight - timeAxisHeight
    let circleD
    let rowHeight
    let colWidth
    let centerAQI
    let centerInfor
    let levelCityList
    let startDate = new Date(stateObj.selTime.start)
    let endDate = new Date(stateObj.selTime.end)
    let sDate = new Date(stateObj.selTime.start)
    let eDate
    let sDateIndex
    let totalDayNum
    let cityNum
    let clusterNum
    let clusterInfo
    let clusterItemList
    let curDayNum
    let cityTemporalList
    let globalCityTemporalList
    let evolutionList
    let globalEvolutionList
    let evolutionMtx
    let curStackList
    let vmsp_pattern
    let curImportanceList
    let curSurpriseList
    let clusterCityList
    let xCoord
    let yCoord
    let xCoordStd
    let yCoordStd
    let xLocList
    let yLocList
    let xLocScale
    let yLocScale
    let circleItemR
    // const colorList = ['#29abe3', '#60ee62', '#ffec36', '#ff8626', '#f40000', '#ac0000']
    // const colorList = ['00FF00', '#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const colorList = [d3.interpolateRdYlGn(1), d3.interpolateRdYlGn(0.6), d3.interpolateRdYlGn(0.4), d3.interpolateRdYlGn(0.3), d3.interpolateRdYlGn(0.2), d3.interpolateRdYlGn(0.1), d3.interpolateRdYlGn(0)]

    // const colorList = ['#01e400', d3.interpolateRdYlGn(0.9), '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const aqiColorScheme = [d3.scaleLinear()
    //   .domain([0, 50, 100, 150, 200, 300, 500])
    //   .range(colorList)]

    onMounted(() => {
      svg = d3.select("#evolutionFlow")
              .attr('width', width)
              .attr('height', height)
    })

    function asc(a, b) {
      return a['AQI'] - b['AQI'];
    }

    function getDaysBetween(dateString1, dateString2) {
      const  startDate = Date.parse(dateString1);
      const  endDate = Date.parse(dateString2);
      const days = (endDate - startDate)/(1*24*60*60*1000);
      // alert(days);
      return days;
    }

    function getOrderLevelID (oldID) {
      let newID = -1
      for (let i = 0; i < stateObj.clusterNum; ++i) {
        if (oldID === centerInfor[i]['original_id']) newID = i
      }
      return newID
    }

    function getOrderPointsID (oldID) {
      let newID = -1
      for (let i = 0; i < stateObj.clusterNum; ++i) {
        if (oldID === centerInfor[i]['original_id']) newID = i
      }
      return newID
    }

    function getArrayIndex(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    }

    Array.prototype.getArrayIndex=function(obj){
      for(var i=0;i<this.length;i++){
        if (this[i] === obj) {
          return i;
        }
      }
      return -1;
    }

    const distance = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

    function violin(radar_region, center_data, center_aqi, getColor, label_num, getLen, var_names, max_iaqi, r) {
      const radius = r, total = center_data[0].length, level = 5, realRadius = radius / 2
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
        RadarChart(".flow-radar" + (i), data[i], radarChartOptions);
      }

      // 添加最大值标记
      let vinlinHeight = document.getElementsByClassName('gridCircle')[0].getAttribute('r') * 1;
      const maxScale = d3.scaleLinear().domain([0, 500]).range([5, vinlinHeight])
      let axisWrapper = d3.selectAll('.axisWrapper')
      for (let i = 0; i < center_data.length; ++i) {
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
    }

    function processData() {
      startDate = new Date(stateObj.selTime.start)
      endDate = new Date(stateObj.selTime.end)
      // sDate = new Date()
      // console.log(sDate);
      eDate = new Date()
      curDayNum = dayPerScreen
      let tmp_eDate = sDate.getTime() + (dayPerScreen-1)*24*60*60*1000
      if (tmp_eDate < endDate) {
        eDate.setTime(tmp_eDate)
      }
      else {
        eDate.setTime(endDate.getTime())
        curDayNum = (eDate.getTime() - sDate.getTime()) / (1000*60*60*24) + 1
      }

      levelCityList = []
      for (let i = 0; i < clusterNum; ++i) {
        levelCityList.push([])
        for (let j = 0; j < curDayNum; ++j) {
          levelCityList[i].push([])
          for (let k = 0; k < stateObj.selCityList.length; ++k) {
            levelCityList[i][j].push({'exist': 0, 'pre': -1, 'post': -1})
          }
        }
      }
      console.log(stateObj.selCityList);
      console.log(clusterItemList);
      for (let i = 0; i < clusterItemList.length; ++i) {
        let curDate = new Date(clusterItemList[i].date)
        if (curDate < sDate || curDate > eDate ) continue
        let cityIndex = getArrayIndex(stateObj.selCityList, clusterItemList[i].city)
        // console.log(cityIndex);
        let levelIndex = getOrderLevelID(clusterItemList[i].label)
        let dateIndex = (curDate.getTime() - sDate.getTime()) / (1000*60*60*24)
        // console.log(cityIndex, dateIndex, levelIndex, clusterItemList[i].value);
        // console.log(dateIndex);
        // console.log(clusterItemList[i], cityIndex, dateIndex, levelIndex);

        levelCityList[levelIndex][dateIndex][cityIndex].exist = 1
        if (dateIndex != 0) levelCityList[levelIndex][dateIndex][cityIndex].pre = getOrderLevelID(clusterItemList[i-1].label)
        if (dateIndex != curDayNum-1) levelCityList[levelIndex][dateIndex][cityIndex].post = getOrderLevelID(clusterItemList[i+1].label)
        // levelCityList[levelIndex][dateIndex].push(cityIndex)
      }
      console.log(levelCityList);

      varNames = []
      for (let i = 0; i < allVarNames.length; ++i) {
        if (stateObj.valFlag[i] === 1) varNames.push(allVarNames[i])
      }

      cityTemporalList = []
      evolutionMtx = []
      for (let i = 0; i < curDayNum-1; ++i) {
        evolutionMtx.push([])
        for (let j = 0; j < clusterNum; ++j) {
          evolutionMtx[i].push([])
          for (let k = 0; k < clusterNum; ++k) {
            evolutionMtx[i][j].push({'count': 0, 'cityList': []})
          }
        }
      }
      sDateIndex = (sDate.getTime() - startDate.getTime()) / (1000*60*60*24)
      for (let i = 0; i < stateObj.selCityList.length; ++i) {
        let tmp_city = stateObj.selCityList[i]
        // let tmp_city_id = stateObj.selCityList[i]
        let temporalList = []
        for (let j = 0; j < curDayNum; ++j) {
          let tmp_index =  getArrayIndex(clusterCityList,tmp_city) * totalDayNum + j + sDateIndex
          let tmp_item = clusterItemList[tmp_index]
          temporalList.push(getOrderLevelID(tmp_item.label))
          if (j === curDayNum-1) continue
          evolutionMtx[j][getOrderLevelID(tmp_item.label)][getOrderLevelID(clusterItemList[tmp_index+1].label)].count += 1
          evolutionMtx[j][getOrderLevelID(tmp_item.label)][getOrderLevelID(clusterItemList[tmp_index+1].label)].cityList.push(tmp_city)
        }
        cityTemporalList.push({'city': tmp_city, 'loc': stateObj.selectedLocs[i], 'temporal': temporalList})
      }
      // console.log(cityTemporalList);
      // console.log(evolutionMtx);

      evolutionList = []
      for (let i = 0; i < evolutionMtx.length; ++i) {
        for (let j = 0; j < clusterNum; ++j) {
          for (let k = 0; k < clusterNum; ++k) {
            if (evolutionMtx[i][j][k] !== 0)
              evolutionList.push({'dateIndex': i, 'source': j, 'target': k, 'count': evolutionMtx[i][j][k].count, 'cityList': evolutionMtx[i][j][k].cityList})
          }
        }
      }
      // getData(store, 'flow_importance_list', JSON.stringify(evolutionList), JSON.stringify(curStackList), stateObj.selCityList.length, clusterNum)
      for (let i = 0; i < evolutionList.length; ++i) {
        let change_score = (Math.abs(evolutionList[i]['source'] - evolutionList[i]['target'])) / (clusterNum - 1)
        let level_score = Math.max(evolutionList[i]['source'], evolutionList[i]['target']) / clusterNum
        let count_score = evolutionList[i]['count'] / cityNum * 1.2
        let importance = change_score + level_score + count_score

        let cur_dis = curStackList[sDateIndex + evolutionList[i]['dateIndex']]
        let cur_dis_next = curStackList[sDateIndex + evolutionList[i]['dateIndex']+1]
        let source_rate = cur_dis[evolutionList[i]['source']]['cnt'] / cityNum
        let target_rate = cur_dis_next[evolutionList[i]['target']]['cnt'] / cityNum
        let count_rate = evolutionList[i]['count'] / cityNum
        let source_rate_score = 0
        let target_rate_score = 0
        if (source_rate != 0)
            source_rate_score = 1.0 / source_rate
        if (target_rate != 0)
            target_rate_score = 1.0 / target_rate
        let surprise = (source_rate_score + target_rate_score) * change_score
        evolutionList[i]['importance'] = importance
        evolutionList[i]['surprise'] = surprise
      }
      curImportanceList = evolutionList.map(item => item.importance)
      curSurpriseList = evolutionList.map(item => item.surprise)
      // console.log(evolutionList);
    }
    
    // 遮挡处理
    function cluterHandle (detect_scale) {
      let rDetect = circleItemR * detect_scale
      let rDis = rDetect * 2 / 0.7
      let cluterFlag = 0
      for (let i = 0; i < xCoord.length; ++i) {
        for (let j = i + 1; j < xCoord.length; ++j) {
          let dis = distance(xCoord[i], yCoord[i], xCoord[j], yCoord[j])
          if (dis < rDis) {
            cluterFlag = 1
            // 需要对遮挡进行处理
            let xRate = Math.abs(xCoord[i] - xCoord[j]) / dis
            let yRate = Math.abs(yCoord[i] - yCoord[j]) / dis
            let xMove = (rDis - dis) * xRate
            let yMove = (rDis - dis) * yRate
            // console.log(xMove, yMove);
            let xFlag = 1, yFlag = 1
            if (xCoord[i] < xCoord[j]) xFlag = -1
            if (yCoord[i] < yCoord[j]) yFlag = -1
            let xPosProp1 = xFlag > 0 ? ((circleD - xCoord[i]) / circleD) : (xCoord[i] / circleD), xPosProp2 = xFlag > 0 ? (xCoord[j] / circleD) : ((circleD - xCoord[j]) / circleD), xPosPropMid = Math.abs(xCoord[i] - xCoord[j]) / circleD
            let yPosProp1 = yFlag > 0 ? ((circleD - yCoord[i]) / circleD) : (yCoord[i] / circleD), yPosProp2 = yFlag > 0 ? (yCoord[j] / circleD) : ((circleD - yCoord[j]) / circleD), yPosPropMid = Math.abs(yCoord[i] - yCoord[j]) / circleD
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
                if (xPlus !== xMinus) {
                  let xMinusRate = (xCoord[k] - xMinus) / (xPlus - xMinus)
                  // console.log(xMinusRate);
                  xCoord[k] = xFlag > 0 ? (xCoord[j] + (xCoord[i] - xCoord[j]) * xMinusRate) : (xCoord[i] + (xCoord[j] - xCoord[i]) * xMinusRate)
                }
              }
              else if (xCoord[k] > xPlus) {
                if (xCoord[k] - xPlus < rDetect) {
                  let xMinusRate = (xPlus - xMinus) / (xCoord[k] - xMinus)
                  if (xMinusRate !== 0)
                    xCoord[k] = xFlag > 0 ? (xCoord[j] + (xCoord[i] - xCoord[j]) / xMinusRate) : (xCoord[i] + (xCoord[j] - xCoord[i]) / xMinusRate)
                }
                else {
                  let xBorderRate = (xCoord[k] / circleD)
                  let xPlusMove = xFlag > 0 ? xMove * (xPosProp1 + xPosPropMid * 0.5) : xMove * (xPosProp2 + xPosPropMid * 0.5)
                  xCoord[k] += xPlusMove * (1 - xBorderRate)
                }
              }
              else if (xCoord[k] < xMinus) {
                if (xMinus - xCoord[k] < rDetect) {
                  let xPlusRate = (xPlus - xMinus) / (xPlus - xCoord[k])
                  // console.log(xPlusRate);
                  if (xPlusRate !== 0)
                    xCoord[k] = xFlag > 0 ? (xCoord[i] - (xCoord[i] - xCoord[j]) / xPlusRate) : (xCoord[j] - (xCoord[j] - xCoord[i]) / xPlusRate)
                }
                else {
                  let xBorderRate = (xCoord[k] / circleD)
                  let xMinusMove = xFlag < 0 ? xMove * (xPosProp1 + xPosPropMid * 0.5) : xMove * (xPosProp2 + xPosPropMid * 0.5)
                  xCoord[k] -= xMinusMove * xBorderRate
                }
              }

              if (yCoord[k] <= yPlus && yCoord[k] >= yMinus) {
                if (yPlus !== yMinus) {
                  let yMinusRate = (yCoord[k] - yMinus) / (yPlus - yMinus)
                  yCoord[k] = yFlag > 0 ? (yCoord[j] + (yCoord[i] - yCoord[j]) * yMinusRate) : (yCoord[i] + (yCoord[j] - yCoord[i]) * yMinusRate)
                }
              }
              else if (yCoord[k] > yPlus) {
                if (yCoord[k] - yPlus < rDetect) {
                  let yMinusRate = (yPlus - yMinus) / (yCoord[k] - yMinus)
                  // console.log(yMinusRate);
                  if (yMinusRate !== 0)
                    yCoord[k] = yFlag > 0 ? (yCoord[j] + (yCoord[i] - yCoord[j]) / yMinusRate) : (yCoord[i] + (yCoord[j] - yCoord[i]) / yMinusRate)
                }
                else {
                  let yBorderRate = (yCoord[k] / circleD)
                  let yPlusMove = yFlag > 0 ? yMove * (yPosProp1 + yPosPropMid * 0.5) : yMove * (yPosProp2 + yPosPropMid * 0.5)
                  yCoord[k] += yPlusMove * (1 - yBorderRate)
                }
              }
              else if (yCoord[k] < yMinus) {
                if (yMinus - yCoord[k] < rDetect) {
                  let yPlusRate = (yPlus - yMinus) / (yPlus - yCoord[k])
                  if (yPlusRate !== 0)
                    yCoord[k] = yFlag > 0 ? (yCoord[i] - (yCoord[i] - yCoord[j]) / yPlusRate) : (yCoord[j] - (yCoord[j] - yCoord[i]) / yPlusRate)
                }
                else {
                  let yBorderRate = (yCoord[k] / circleD)
                  let yMinusMove = yFlag < 0 ? yMove * (yPosProp1 + yPosPropMid * 0.5) : yMove * (yPosProp2 + yPosPropMid * 0.5)
                  yCoord[k] -= yMinusMove * yBorderRate
                }
              }
            }
          }
        }
      }

      for (let i = 0; i < xCoord.length; ++i) {
        if (xCoord[i] > circleD) xCoord[i] = circleD
        if (xCoord[i] < 0) xCoord[i] = 0
        if (yCoord[i] > circleD) yCoord[i] = circleD
        if (yCoord[i] < 0) yCoord[i] = 0
      }

      return cluterFlag
    }

    function angle(start, end){
      let diff_x = end[0] - start[0],
          diff_y = end[1] - start[1];
      //返回角度,不是弧度
      return 360 * Math.atan(diff_y / diff_x) / (2 * Math.PI)
    }


    function cluterHandleNew (detect_scale) {
      let rDetect = circleItemR * detect_scale
      let rDis = rDetect * 2
      let center = [0, 0]
      let pointOrderList = []
      for (let i = 0; i < xCoord.length; ++i) {
        let tmpDis = distance(center[0], center[1], xCoord[i], yCoord[i])
        let tmpAngle = angle(center, [xCoord[i], yCoord[i]])
        pointOrderList.push({'x': xCoord[i], 'y': yCoord[i], 'dis': tmpDis, 'angle': tmpAngle, 'orginal_id': i})
      }
      pointOrderList.sort((a, b) => a['dis'] - b['dis'])
      console.log(pointOrderList);
      // let maxDis = Math.max(...pointOrderList.map(item => item.dis)) 
      // console.log(maxDis, circleD / 2);
      let existPointsList = []
      for (let i = 0; i < pointOrderList.length; ++i) {
        if (existPointsList.length === 0) 
          existPointsList.push(pointOrderList[i])
        else {
          let tmpCnt = 0
          while (tmpCnt < 100) {
            let cluterFlag = 0
            for (let j = 0; j < existPointsList.length; ++j) {
              let tmpDis = distance(existPointsList[j].x, existPointsList[j].y, pointOrderList[i].x, pointOrderList[i].y)
              if (tmpDis < rDis) {
                cluterFlag = 1
                let 

              }
            }
            if (cluterFlag === 0) break
          }
          existPointsList.push(pointOrderList[i])
        }
      }
    }

    // 画时间坐标轴
    function drawTimeAxis() {
      let temp_eDate = new Date()
      // console.log(sDate);
      temp_eDate.setTime(eDate.getTime() - 24*60*60*1000)
      const timeScale = d3.scaleTime()
              .domain([sDate, temp_eDate])
              .nice()
              .range([colWidth/2, flowRegionWidth-colWidth/2])
      const timeAxis = d3.axisTop(timeScale).ticks(14).tickFormat(d => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${weekday[d.getDay()]}`);
      svg.append('g')
        .attr('class', 'local-time-axis')
        .attr("transform",`translate(${radarRegionWidth},${timeAxisHeight*0.8})`)
    		.call(timeAxis);
    }

    // 画圆形
    function drawCircles() {
      d3.select('.circleRegion').remove()

      const rightArc = d3.arc()
        .innerRadius(circleItemR * 1.25)
        .outerRadius(circleItemR * 1.5)
        .startAngle(Math.PI * 0.2)
        .endAngle(Math.PI * 0.8);
      
      const leftArc = d3.arc()
        .innerRadius(circleItemR * 1.25)
        .outerRadius(circleItemR * 1.5)
        .startAngle(Math.PI * 1.2)
        .endAngle(Math.PI * 1.8);

      circleRegion = svg.append('g').attr('class', 'circleRegion')
                .selectAll('g')
                .data(levelCityList)
                .join('g')
                  .attr("transform", (d, i) => `translate(0, ${timeAxisHeight+rowHeight*i-rowHeight*0.1})`)
                .selectAll('g')
                .data((d, i) => d)
                .join('g')
                  .attr("transform", (d, i) => `translate(${radarRegionWidth+colWidth*i}, 0)`)
      
      circleRegion.append('circle')
          .attr('r', circleD / 2)
          .attr('cx', colWidth / 2)
          .attr('cy', rowHeight / 2)
          .attr('fill', '#fff')
          .attr('stroke', '#999')
      let circleItemRegion = circleRegion.append('g')
          .attr('class', 'circleItem')
          .selectAll('circle')
          .data(stateObj.selectedLocs)
          .join('g')
            .attr('label-id', (d, i) => i)
            .attr('class', 'circleItemRegion')
            .attr("transform", (d, i) => `translate(${xCoord[i] + colWidth/2}, ${yCoord[i] + rowHeight/2})`)
      circleItemRegion.append('circle')
          .attr('r', circleItemR)
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('fill', '#bbb')
      circleItemRegion.append('path')
          .attr('class', 'leftArc')
          .attr('d', leftArc)
      circleItemRegion.append('path')
          .attr('class', 'rightArc')
          .attr('d', rightArc)
      
      // 给点着色
      let circleItemSet = d3.selectAll('.circleItem')
      // console.log(circleItemSet);
      
      // console.log(centerInfor);
      // console.log(circleRegion);
      // console.log(stateObj.selectedLocs.map(item => [xLocScale(item.loc[0])+(colWidth-circleD*0.7)/2, yLocScale(item.loc[1])+(rowHeight-circleD*0.7)/2]))
      // console.log(cityTemporalList.map(item => [xLocScale(item.loc[0])+(colWidth-circleD*0.7)/2, yLocScale(item.loc[1])+(rowHeight-circleD*0.7)/2]))
      for (let i = 0; i < clusterNum; ++i) {
        for (let j = 0; j < curDayNum; ++j) {
          let circleItem = d3.select(circleRegion._groups[i][j])
          circleItem.selectAll('.circleItemRegion circle')
              .data(levelCityList[i][j])
              .join('cirlce')
              .attr('fill', (d, k) => {
                if (stateObj.focused_city !== 'None' && stateObj.selCityList[k] !== stateObj.focused_city) {
                  if (d.exist === 0) return '#bbb'
                  if (d.exist === 1 && levelCityList[i][j].map(item => item.exist)[getArrayIndex(stateObj.selCityList, stateObj.focused_city)] === 1)
                      return '#5c9fc9'
                  else return '#bbb'
                }
                else if (stateObj.focused_city !== 'None' && stateObj.selCityList[k] === stateObj.focused_city) {
                  if (d.exist === 0) return '#bbb'
                  let tmpAQI = centerInfor[i]['AQI']
                  if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                  else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                  else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                  else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                  else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                }
                else if (stateObj.focused_city === 'None') {
                  if (d.exist === 0) return '#bbb'
                  else if (d.exist === 1 || stateObj.selCityList[k] === stateObj.focused_city) {
                    let tmpAQI = centerInfor[i]['AQI']
                    if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                    else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                    else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                    else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                    else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                  }
                }
                else return 'bbb'
              })
          if (j === 0) circleItem.selectAll('.circleItemRegion .leftArc').remove()
          else {
            // for (let k = 0; k < stateObj.selectedLocs.length; ++k) {
            //   console.log(xLocScale(stateObj.selectedLocs[k][0])+(colWidth-circleD*0.7)/2, yLocScale(stateObj.selectedLocs[k][1])+(colWidth-circleD*0.7)/2);
            // }
            circleItem.selectAll('.circleItemRegion .leftArc')
              .data(levelCityList[i][j])
              .join('path')
              .attr('label-id', (d,k) => k)
              .attr('opacity', (d, k) => {
                if (stateObj.focused_city != 'None' && stateObj.selCityList[k] !== stateObj.focused_city) return 0
                else return d.exist
              })
              .attr('stroke', (d, k) => {
                // if (i === 1) return '#00ffffff'
                // console.log(d, k);
                // console.log(k, xLocScale(stateObj.selectedLocs[k][0])+(colWidth-circleD*0.7)/2, yLocScale(stateObj.selectedLocs[k][1])+(rowHeight-circleD*0.7)/2);
                if (d.exist === 0) return '#bbb'
                else if (d.exist === 1) {
                  // let tmpLevel = cityTemporalList[k].temporal[j-1]
                  // console.log(k, tmpLevel)
                  let tmpAQI = centerInfor[d.pre]['AQI']
                  if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                  else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                  else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                  else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                  else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                }
              })
          }
          if (j === curDayNum - 1) circleItem.selectAll('.circleItemRegion .rightArc').remove()
          else {
            circleItem.selectAll('.circleItemRegion .rightArc')
              .data(levelCityList[i][j])
              .join('path')
              .attr('label-id', (d,k) => k)
              .attr('opacity', (d, k) => {
                if (stateObj.focused_city != 'None' && stateObj.selCityList[k] !== stateObj.focused_city) return 0
                else return d.exist
              })
              .attr('stroke', (d, k) => {
                // if (i === 1) return '#00ffffff'
                if (d.exist === 0) return '#bbb'
                else if (d.exist === 1) {
                  // console.log(k, cityTemporalList[k].temporal);
                  // let tmpLevel = cityTemporalList[k].temporal[j+1]
                  let tmpAQI = centerInfor[d.post]['AQI']
                  if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                  else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                  else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                  else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                  else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                }
              })
          }
          if (levelCityList[i][j].map(item => item.exist).indexOf(1) === -1) {
            d3.select(circleRegion._groups[i][j]).remove()
          }
        }
      }
    }

    function drawRadar() {
      radarContainer = svg.append('g').attr('class', 'radar-container')
      radarRegion = radarContainer.selectAll(".radar")
                .data(clusterInfo.centers)
                .enter().append("g")
                .attr("class", (d,i) => "flow-radar"+(i)) 
                .attr("transform", (d,i) => `translate(${radarRegionWidth/2}, ${timeAxisHeight+rowHeight*0.4+rowHeight*i})`)
      let curLabelNum = []
      for (let i = 0; i < clusterNum; ++i) {
        curLabelNum.push(0)
        for (let j = 0; j < curDayNum; ++j) {
          for (let k = 0; k < stateObj.selCityList.length; ++k) {
            curLabelNum[i] += levelCityList[i][j][k].exist
          }
        }
      }
      const lenScale = d3.scaleLinear()
        .domain([0, curDayNum * stateObj.selCityList.length])
        .range([0,15])
      violin(radarRegion, centerInfor.map(item=>item.point), centerInfor.map(item=>item.AQI), aqiColorScheme, curLabelNum, lenScale, varNames, clusterInfo['iaqi_max'], circleD, )
    }

    function drawLink() {
      d3.select('.links').remove()
      d3.select('.links-single').remove()
      for (let i = 0; i < clusterNum; ++i) {
        for (let j = 0; j < clusterNum; ++j) {
          let linerGradient = svg.append("linearGradient")
                .attr("id",`linearColor-${i}-${j}`)
                .attr("x1","0%")
                .attr("y1","0%")
                .attr("x2","100%")
                .attr("y2","0%");
          
          let startAQI = centerInfor[i]['AQI']
          let endAQI = centerInfor[j]['AQI']
          let startColor, endColor
          if (startAQI >= 0 && startAQI <= 50) startColor = aqiColorScheme[0](startAQI)
          else if (startAQI > 50 && startAQI <= 150) startColor = aqiColorScheme[1](startAQI)
          else if (startAQI > 150 && startAQI <= 200) startColor = aqiColorScheme[2](startAQI)
          else if (startAQI > 200 && startAQI <= 300) startColor = aqiColorScheme[3](startAQI)
          else if (startAQI > 300) startColor = aqiColorScheme[4](startAQI)

          if (endAQI >= 0 && endAQI <= 50) endColor = aqiColorScheme[0](endAQI)
          else if (endAQI > 50 && endAQI <= 150) endColor = aqiColorScheme[1](endAQI)
          else if (endAQI > 150 && endAQI <= 200) endColor = aqiColorScheme[2](endAQI)
          else if (endAQI > 200 && endAQI <= 300) endColor = aqiColorScheme[3](endAQI)
          else if (endAQI > 300) endColor = aqiColorScheme[4](endAQI)

          let stop1 = linerGradient.append("stop")
                    .attr("offset","0%")
                    .style("stop-color", startColor);
          let stop2 = linerGradient.append("stop")
                    .attr("offset","30%")
                    .style("stop-color", startColor);
          let stop3 = linerGradient.append("stop")
                    .attr("offset","70%")
                    .style("stop-color", endColor);
          let stop4 = linerGradient.append("stop")
                    .attr("offset","100%")
                    .style("stop-color", endColor);
        }
      }

      let curveGenerator = d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
      const curveColor = d3.scaleLinear()
        .domain([1, stateObj.selCityList.length])
        // .range(['#a50026','#d3d3d3']);
        .range(['#05649d','#c3c3c3']);
      const curveWidth = d3.scaleLinear()
        .domain([0, stateObj.selCityList.length])
        .range([0, circleD * 0.95])
      const curveColorSurprise = d3.scaleLinear()
        .domain([Math.max(...curSurpriseList), Math.min(...curSurpriseList)])
        .range(['#05649d','#c3c3c3']);
      const curveOpacitySurprise = d3.scaleLinear()
        .domain([Math.max(...curSurpriseList), Math.min(...curSurpriseList)])
        .range([0.95, 0.4]);
      const curveColorImportance = d3.scaleLinear()
        .domain([Math.max(...curImportanceList), Math.min(...curImportanceList)])
        .range(['#05649d','#c3c3c3']);
      const curveOpacityImportance = d3.scaleLinear()
        .domain([Math.max(...curImportanceList), Math.min(...curImportanceList)])
        .range([0.95, 0.4]);

      svg.append('g').attr('class', 'links')
          .selectAll('path')
          .data(evolutionList)
          .join('path')
            .attr('d', (d, i) => {
              let sourceX = radarRegionWidth + colWidth * (d.dateIndex + 0.6)
              let sourceY = timeAxisHeight + rowHeight * (d.source + 0.4)
              let targetX = radarRegionWidth + colWidth * (d.dateIndex + 1.4)
              let targetY = timeAxisHeight + rowHeight * (d.target + 0.4)
              if (d.source < d.target) {
                sourceY += rowHeight * 0.12
                targetY -= rowHeight * 0.12
              }
              else if (d.source > d.target) {
                sourceY -= rowHeight * 0.12
                targetY += rowHeight * 0.12
              }
              // console.log(sourceX, sourceY);
              // console.log(targetX, targetY);
              return curveGenerator({source: {y: sourceX, x: sourceY}, target: {y: targetX, x: targetY}})
            })
            .attr('fill', 'none')
            .attr("stroke", d => {
              if (d.source > d.target && stateObj.flow_filters.indexOf('up') === -1) return "#cecece"
              if (d.source === d.target && stateObj.flow_filters.indexOf('stable') === -1) return "#cecece"
              if (d.source < d.target && stateObj.flow_filters.indexOf('down') === -1) return "#cecece"
              for (let i = 0; i < stateObj.clusterNum; ++i) {
                if (Math.abs(d.source - d.target) === i && stateObj.span_filters.indexOf(i.toString()) === -1) return "#cecece"
              }
              if (d.count < stateObj.count_range[0] || d.count > stateObj.count_range[1]) return "#cecece"

              // if (stateObj.flow_color === 'Importance')
              //   return curveColorImportance(d.importance)
              // else if (stateObj.flow_color === 'Surprise')
              //   return curveColorSurprise(d.surprise)
              if (stateObj.focused_city != 'None') return "#cecece"

              if (d.source === d.target && stateObj.flow_filters.indexOf('stable') !== -1) {
                let tmpAQI = centerInfor[d.source]['AQI']
                if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
              }

              return `url(#linearColor-${d.source}-${d.target})`
            })
            .attr("opacity", (d, i) => {
              if (d.source > d.target && stateObj.flow_filters.indexOf('up') === -1) return 0.4
              if (d.source === d.target && stateObj.flow_filters.indexOf('stable') === -1) return 0.4
              if (d.source < d.target && stateObj.flow_filters.indexOf('down') === -1) return 0.4
              for (let i = 0; i < stateObj.clusterNum; ++i) {
                if (Math.abs(d.source - d.target) === i && stateObj.span_filters.indexOf(i.toString()) === -1) return 0.4
              }
              if (d.count < stateObj.count_range[0] || d.count > stateObj.count_range[1]) return 0.4

              if (stateObj.flow_color === 'Importance')
                return curveOpacityImportance(d.importance)
              else if (stateObj.flow_color === 'Surprise')
                return curveOpacitySurprise(d.surprise)
            })
            .attr("stroke-width", d => curveWidth(d.count))
      
      svg.append('g').attr('class', 'links-single')
          .selectAll('path')
          .data(evolutionList)
          .join('path')
            .attr('d', (d, i) => {
              let sourceX = radarRegionWidth + colWidth * (d.dateIndex + 0.6)
              let sourceY = timeAxisHeight + rowHeight * (d.source + 0.4)
              let targetX = radarRegionWidth + colWidth * (d.dateIndex + 1.4)
              let targetY = timeAxisHeight + rowHeight * (d.target + 0.4)
              if (d.source < d.target) {
                sourceY += rowHeight * 0.12
                targetY -= rowHeight * 0.12
              }
              else if (d.source > d.target) {
                sourceY -= rowHeight * 0.12
                targetY += rowHeight * 0.12
              }
              // console.log(sourceX, sourceY);
              // console.log(targetX, targetY);
              if (d.cityList.indexOf(stateObj.focused_city) !== -1)
                return curveGenerator({source: {y: sourceX, x: sourceY}, target: {y: targetX, x: targetY}})
              else return ""
            })
            .attr('fill', 'none')
            .attr("stroke", d => {
              if (d.source > d.target && stateObj.flow_filters.indexOf('up') === -1) return "#cecece"
              if (d.source === d.target && stateObj.flow_filters.indexOf('stable') === -1) return "#cecece"
              if (d.source < d.target && stateObj.flow_filters.indexOf('down') === -1) return "#cecece"
              for (let i = 0; i < stateObj.clusterNum; ++i) {
                if (Math.abs(d.source - d.target) === i && stateObj.span_filters.indexOf(i.toString()) === -1) return "#cecece"
              }
              // if (d.count < stateObj.count_range[0] || d.count > stateObj.count_range[1]) return "#cecece"

              // if (stateObj.flow_color === 'Importance')
              //   return curveColorImportance(d.importance)
              // else if (stateObj.flow_color === 'Surprise')
              //   return curveColorSurprise(d.surprise)
              if (d.cityList.indexOf(stateObj.focused_city) !== -1) {
                if (d.source === d.target && stateObj.flow_filters.indexOf('stable') !== -1) {
                  let tmpAQI = centerInfor[d.source]['AQI']
                  if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                  else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                  else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                  else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                  else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                }
                return `url(#linearColor-${d.source}-${d.target})`  
              }
              else return "#cecece"
            })
            .attr("opacity", (d, i) => {
              if (d.cityList.indexOf(stateObj.focused_city) !== -1) {
              //   if (stateObj.flow_color === 'Importance')
              //   return curveOpacityImportance(d.importance)
              // else if (stateObj.flow_color === 'Surprise')
              //   return curveOpacitySurprise(d.surprise)
                return 0.95
              }
              else return 0
            })
            .attr("stroke-width", d => curveWidth(1))
    }

    watch (() => stateObj.span_filters, (oldVlaue, newValue) => {
      drawLink()
      drawCircles()
    })

    watch (() => stateObj.flow_filters, (oldVlaue, newValue) => {
      drawLink()
      drawCircles()
    })

    watch (() => stateObj.focused_city, (oldVlaue, newValue) => {
      drawLink()
      drawCircles()
    })

    watch (() => stateObj.count_range, (oldVlaue, newValue) => {
      // console.log(stateObj.clusteringResult);
      if (stateObj.clusteringResult.length !== 0 && stateObj.selCityList.length === cityTemporalList.length) {
        drawLink()
        drawCircles()
      }
    })

    watch (() => stateObj.flow_color, (oldVlaue, newValue) => {
      // console.log(stateObj.clusteringResult);
      drawLink()
      drawCircles()
    })

    watch (() => stateObj.vmsp_pattern, (oldVlaue, newValue) => {
      vmsp_pattern = stateObj.vmsp_pattern
      console.log(vmsp_pattern);
    })

    watch (() => stateObj.clusteringResult, (oldVlaue, newValue) => {
      $("#evolutionFlow").empty();
      clusterInfo = stateObj.clusteringResult['cluster_info']
      clusterNum = stateObj.clusterNum
      clusterItemList = stateObj.clusteringResult['data']
      cityNum = stateObj.selCityList.length
      centerAQI = clusterInfo.centers.map(val => Math.max(...val))
      centerInfor = []
      for (let i = 0; i < clusterNum; ++i) {
        centerInfor.push({'point': clusterInfo.centers[i], 'AQI': centerAQI[i], 'original_id': i})
      }
      centerInfor.sort(asc)
      sDate = new Date(stateObj.selTime.start)
      totalDayNum = getDaysBetween(stateObj.selTime.start, stateObj.selTime.end) + 1
      curStackList = []
      for (let i = 0; i < totalDayNum; ++i) {
        curStackList.push([])
        for (let j = 0; j < clusterNum; ++j) {
          curStackList[i].push({'cnt': 0, 'stack': 0})
        }
      }
      for (let i = 0; i < clusterItemList.length; ++i) {
        let curDate = new Date(clusterItemList[i].date)
        let levelIndex = getOrderLevelID(clusterItemList[i].label)
        let dateIndex = (curDate.getTime() - startDate.getTime()) / (1000*60*60*24)
        curStackList[dateIndex][levelIndex]['cnt'] += 1
        // levelCityList[levelIndex][dateIndex].push(cityIndex)
      }
      for (let i = 0; i < totalDayNum; ++i) {
        for (let j = 0; j < clusterNum-1; ++j) {
          curStackList[i][j+1]['stack'] += curStackList[i][j]['stack'] + curStackList[i][j]['cnt']
        }
      }
      clusterCityList = []
      for (let i = 0; i < clusterItemList.length; i += totalDayNum) {
        clusterCityList.push(clusterItemList[i].city)
      }

      if (clusterNum <= 4) circleD = 70
      else if (clusterNum <= 6) circleD = 60
      else circleD = 50

      if (stateObj.selCityList.length > 20) circleItemR = 2.6
      else circleItemR = 3

      rowHeight = chartHeight / clusterNum
      colWidth = flowRegionWidth / dayPerScreen

      xCoord = []
      yCoord = []
      xCoordStd = []
      yCoordStd = []
      xLocList = stateObj.selectedLocs.map(item => item[0])
      yLocList = stateObj.selectedLocs.map(item => item[1])
      
      let xMax = Math.max(...xLocList)
      let xMin = Math.min(...xLocList)
      let yMax = Math.max(...yLocList)
      let yMin = Math.min(...yLocList)
      let xMid = (xMin + xMax) / 2
      let yMid = (yMin + yMax) / 2
      
      for (let i = 0; i < xLocList.length; ++i) {
        let tmpX = (xLocList[i] - xMid)
        let tmpY = (yLocList[i] - yMid)
        xCoordStd.push(tmpX)
        yCoordStd.push(tmpY)
      }

      xLocScale = d3.scaleLinear()
            .domain([Math.min(...xCoordStd), Math.max(...xCoordStd)])
            .range([-circleD*0.35, circleD*0.35])
      yLocScale = d3.scaleLinear()
            .domain([Math.min(...yCoordStd), Math.max(...yCoordStd)])
            .range([circleD*0.35, -circleD*0.35])
      for (let i = 0; i < xLocList.length; ++i) {
        xCoord.push(xLocScale(xCoordStd[i]))
        yCoord.push(yLocScale(yCoordStd[i]))
      }

      
      // let cluter_flag = 1
      // while(cluter_flag === 1) {
      //   cluter_flag = cluterHandle()
      // }
      cluterHandleNew(1.5)

      // if (stateObj.selCityList.length <= 20) {
      //   cluterHandle(1.5)
      //   cluterHandle(1.5)
      // }
      // else if (stateObj.selCityList.length <= 36) {
      //   cluterHandle(1)
      // } else {
      //   cluterHandle(1)
      // }

      // 构建城市的全局时序类别序列
      globalCityTemporalList = {}
      for (let i = 0; i < stateObj.selCityList.length; ++i) {
        let tmp_city = stateObj.selCityList[i]
        let temporalList = []
        for (let j = 0; j < totalDayNum; ++j) {
          let tmp_index = i * totalDayNum + j
          let tmp_item = clusterItemList[tmp_index]
          temporalList.push(getOrderLevelID(tmp_item.label))
        }
        globalCityTemporalList[tmp_city] = temporalList
      }
      // console.log(globalCityTemporalList);
      getData(store, 'vmsp_pattern', JSON.stringify(globalCityTemporalList))
      
      processData()
      drawRadar() // 画雷达图
      
      svg.append('line')
        .attr('x1', radarRegionWidth)
        .attr('y1', timeAxisHeight + rowHeight*0.16)
        .attr('x2', radarRegionWidth)
        .attr('y2', timeAxisHeight + rowHeight*0.7 + rowHeight * (clusterNum-1))
        .attr('stroke', '#dedede')

      drawTimeAxis() // 画时间坐标轴
      drawLink()
      drawCircles() // 画圆形

      // 画时间拖拽控件
      let timeSlider = svg.append('g')
      let timeSliderBg = timeSlider
            .append('rect')
              .attr('x', radarRegionWidth)
              .attr('y', height-timeBarHeight)
              .attr('width', flowRegionWidth)
              .attr('height', timeBarHeight)
              .attr('fill', 'none')
              .attr('stroke', "#333")
      let timeBarTicks = timeSlider.append('g')
      
      let sliderWidth = 14.0 / totalDayNum * (flowRegionWidth-2)
      let sliderXScale = d3.scaleTime()
            .domain([startDate, endDate])
            .range([radarRegionWidth+1, width-sliderWidth])
      const weekNum = Math.floor(1.0 * totalDayNum / 14)
      timeBarTicks.append('g')
        .append('text')
          .attr('x', radarRegionWidth+5)
          .attr('y', height-timeBarHeight+12)
          .style('text-anchor', 'start')
          .attr('fill', "#333")
          .attr('font-size', '10px')
          .text(`${startDate.getFullYear()}/${startDate.getMonth()+1}/${startDate.getDate()} ${weekday[startDate.getDay()]}`)
      timeBarTicks.append('g')
        .append('text')
          .attr('x', width-6)
          .attr('y', height-timeBarHeight+12)
          .style('text-anchor', 'end')
          .attr('fill', "#333")
          .attr('font-size', '10px')
          .text(`${endDate.getFullYear()}/${endDate.getMonth()+1}/${endDate.getDate()} ${weekday[endDate.getDay()]}`)
      let tempDate = new Date()
      tempDate.setTime(startDate.getTime() + 28*24*60*60*1000)
      let s = 1
      let intervalNum = 12
      let intervalRange = Math.floor(totalDayNum / intervalNum)

      while (tempDate < endDate && s < intervalNum) {
        if (s % 2 === 1) {
          timeBarTicks.append('g')
            .append('line')
            .attr('x1', radarRegionWidth + (width - radarRegionWidth) * s * intervalRange / totalDayNum)
            .attr('y1', height-timeBarHeight+1)
            .attr('x2', radarRegionWidth + (width - radarRegionWidth) * s * intervalRange / totalDayNum)
            .attr('y2', height-timeBarHeight+10)
            .attr('stroke', "#333")
        } else {
          timeBarTicks.append('g')
          .append('text')
          .attr('x', radarRegionWidth + (width - radarRegionWidth) * s * intervalRange / totalDayNum)
          .attr('y', height-timeBarHeight+12)
          .style('text-anchor', 'middle')
          .attr('fill', "#333")
          .attr('font-size', '10px')
          .text(`${tempDate.getFullYear()}/${tempDate.getMonth()+1}/${tempDate.getDate()} ${weekday[tempDate.getDay()]}`)
        } 
        s += 1
        tempDate.setTime(tempDate.getTime() + intervalRange*24*60*60*1000)
      }

      let timeBars = timeSlider.append('g')
      let timeBarScale = d3.scaleLinear()
            .domain([0, stateObj.selCityList.length])
            .range([0, timeBarHeight * 0.7])
      timeBars.selectAll('g')
            .data(curStackList)
            .join('g')
              .attr("transform", (d, i) => `translate(${radarRegionWidth+1 + i * (flowRegionWidth - 2) / totalDayNum}, ${height-timeBarHeight*0.7})`)
            .selectAll('rect')
            .data((d, i) => d)
            .join('rect')
              .attr('x', 0)
              .attr('y', (d,i) => timeBarScale(d.stack))
              .attr('width', (flowRegionWidth - 2) / totalDayNum)
              .attr('height', (d,i) => timeBarScale(d.cnt))
              .attr('fill', (d,i) => {
                let tmpAQI = centerInfor[i]['AQI']
                if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
              })

      // let globalTimeScale = d3.scaleTime()
      //       .domain([startDate, endDate])
      //       .range([10, width-6])
      //       .nice()
      // let globalTimeAxis = d3.axisBottom(globalTimeScale).ticks(weekNum/2).tickFormat(d => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${weekday[d.getDay()]}`);
      // svg.append('g').attr('class', 'globalTimeAxis')
      //   .attr("transform",`translate(${radarRegionWidth+5},${height-timeBarHeight-3})`)
    	// 	.call(globalTimeAxis);
      // d3.select('.globalTimeAxis path').remove()
      // d3.selectAll('.globalTimeAxis line').remove()
      
      let sliderDrag = d3.drag().on('drag', function (event) {
        // console.log(event.x, event.dx);
        let curSliderX = d3.select('.slider-rect').attr('x')
        let unit = (flowRegionWidth-2) / totalDayNum
        let newSliderX = parseInt(curSliderX) + event.dx
        // console.log(radarRegionWidth, newSliderX);
        if (newSliderX < radarRegionWidth + 1) newSliderX = radarRegionWidth + 1
        if (newSliderX > width-sliderWidth-1) newSliderX = width-sliderWidth - 1
        let stepNum = Math.floor((newSliderX - radarRegionWidth + 1) / unit)
        let move = radarRegionWidth + 1 + stepNum * unit
        d3.select('.slider-rect')
          .attr('x', newSliderX)
        sDate.setTime(startDate.getTime() + stepNum*24*60*60*1000)
        // console.log(sDate);
        processData()
        d3.select('.local-time-axis').remove()
        d3.select('.circleRegion').remove()
        d3.selectAll('.radar-container').remove()
        d3.select('.links').remove()
        drawRadar()
        drawTimeAxis()
        drawLink()
        drawCircles()
      })

      let slider = svg.append('g')
            .append('rect')
              .attr('class', 'slider-rect')
              .attr('x', sliderXScale(sDate))
              .attr('y', height-timeBarHeight*0.7)
              .attr('width', sliderWidth)
              .attr('height', timeBarHeight*0.7)
              .attr('fill', '#999')
              .attr('opacity', 0.6)
              .call(sliderDrag)
      // console.log(d3.select('.slider-rect').attr('x'));

    })
  }
}
</script>

<style scoped>
.outer-container {
  width: 1642px;
  height: 651px;
  border: solid 1px #666;
  /* padding: 1px; */
  margin: 1px;
}

.title-layer {
  /* position: absolute; */
  z-index: 80;
  width: 1641px;
  height: 24px;
  text-align: left;
  padding-left: 12px;
  background-color: #6c757d;
  color: #fff;
}

.inner-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.svg-container {
  width: 1360px;
  height: 626px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.patterSelRegion {
  border-left: solid 1px #dedede;
  width: 280px;
  height: 626px;
  /* background-color: #666; */
}

#evolutionFlow {
  display: block;
}
</style>