<template>
  <div class="outer-container">
    <div class="title-layer">Pattern Evolution View</div>
    <div class="inner-container">
      <div class="svg-container">
        <svg id="evolutionFlow" />
        <div id="tooltip" class="hidden"></div>
        <!-- <div class="flow-interaction"><span id="flow-refresh" class="iconfont">&#xe604;</span></div> -->
      </div>
      <div class="patterSelRegion">
        <div class="config-title">
          <span class="iconfont">&#xea87;</span> Flow Patterns
        </div>
        <div class="filter-region">
          <div>Start Label</div>
          <div class="label-sel-region">
            <!-- <div v-for="item in startLabelList" class="form-check">
              <input class="form-check-input" type="radio" name="flowColorRadio" :value="item" v-model="start_label" @change="onStartLabelChange()">
              <label class="form-check-label" for="flexRadioDefault1">{{ item }}</label>
            </div> -->
            <div v-for="(item, i) in startColorList" @click="selStartLabel(i)" class="label-block" :style="{background: item}" ></div>
          </div>
        </div>
        <div class="tree-region">
          <svg id="pattern-tree" />
        </div>
        <div class="sub-title">
          <div>Patterns Sort:</div>
          <div class='sort-btns'>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="patterSortRadio" id="sort-sup" value="sup" v-model="sort_flag">
              <label class="form-check-label" for="sort-sup">Support</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="patterSortRadio" id="sort-cnt" value="cnt" v-model="sort_flag">
              <label class="form-check-label" for="sort-cnt">Count</label>
            </div>
          </div>
        </div>
        <div class="detail-pattern">
          <!-- <div class="form-group">
            <select multiple class="form-control" id="detail-pattern-sel">
              <option v-for="(item, index) in selPatternList" :key="index" class="detail-pattern-option"> 
                <div class="space-rate-block"><div class='space-cover'></div></div>
                <div class="patter-str">{{ item }} </div> 
                <div class="time-rate-block"><div class='time-cover'></div></div>
              </option>
            </select>
          </div> -->
          <div v-for="(item, index) in selPatternList" :key="index" class="detail-pattern-card" @click="cardClickHandle($event, index)">
            <div class="pattern-card-head">
              <div class="sup-val">#Sup: </div>
              <div class="cnt-val">#Count: </div>
            </div>
            <div class="detail-pattern-block">
              <div class="pattern-trend-region">
                <svg class="pattern-trend-view" />
              </div>
              <div class="pattern-cover-region">
                <svg class="pattern-cover-view" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { ref, computed, watch, onMounted, onUpdated } from 'vue'
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
    let startLabelList = ref([])
    let start_label = ref(0)
    let notChildSeqList = []
    let childSeqList = []
    let startColorList = ref([])
    let selPatternList = ref([])
    let selPatternInfo = []
    let sliderXScale
    let timeSlider
    let patterOccurRegion
    let linkSelFlag = ref(0)
    let selectedLink = {}

    // 树图相关参数
    let treeSVG
    const treeWidth = 258
    const treeHeight = 158

    // 模式图相关参数
    let patternTrendSVG
    let patternCoverSVG
    const patternTrendWidth = 112
    const patternTrendHeight = 102
    const patternCoverWidth = 102
    const patternCoverHeight = 102
    let drawDetail = false
    let sort_flag = ref('sup')
    let sort_change = false
    let focused_pattern = ref({})
    let timeDensity
    let occurPos
    let totalTimeDensity
    let totalOccurPos
    let patternFocusFlag = ref(false)
    let allPatternSeq = []
    let focusedPatternSeq = []
    let patternSeqCityList

    // const colorList = ['#29abe3', '#60ee62', '#ffec36', '#ff8626', '#f40000', '#ac0000']
    // const colorList = ['00FF00', '#01e400', '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const colorList = [d3.interpolateRdYlGn(1), d3.interpolateRdYlGn(0.6), d3.interpolateRdYlGn(0.4), d3.interpolateRdYlGn(0.3), d3.interpolateRdYlGn(0.2), d3.interpolateRdYlGn(0.1), d3.interpolateRdYlGn(0)]

    // const colorList = ['#01e400', d3.interpolateRdYlGn(0.9), '#fec006', '#ff7e00', '#fe0000', '#98004b', '#7e0123']
    // const aqiColorScheme = [d3.scaleLinear()
    //   .domain([0, 50, 100, 150, 200, 300, 500])
    //   .range(colorList)]

    const selStartLabel = (val) => {
      start_label.value = val
      console.log(start_label.value);
      $('.label-block').removeClass('deep-border')
      $(`.label-block:eq(${val})`).addClass('deep-border')
    }

    const cardClickHandle = (e, index) => {
      // console.log(e, i);
      if ($(`.detail-pattern-card:eq(${index})`).hasClass('card-selected')) {
        $(`.detail-pattern-card:eq(${index})`).removeClass('card-selected')
        patternFocusFlag.value = false
        focused_pattern.value = {}
      } else {
        $(`.detail-pattern-card`).removeClass('card-selected')
        $(`.detail-pattern-card:eq(${index})`).addClass('card-selected')
        focused_pattern.value = selPatternInfo[index]
        totalOccurPos = occurPos[index]
        totalTimeDensity = timeDensity[index]
        focusedPatternSeq = allPatternSeq[index]
        // console.log(allPatternSeq);
        // console.log(focusedPatternSeq);
        patternFocusFlag.value = true
      }
    }

    onMounted(() => {
      startDate = new Date(stateObj.selTime.start)
      endDate = new Date(stateObj.selTime.end)
      // console.log(startDate, endDate);
      svg = d3.select("#evolutionFlow")
              .attr('width', width)
              .attr('height', height)
      treeSVG = d3.select('#pattern-tree')
              .attr('width', treeWidth)
              .attr('height', treeHeight)
      // treeSVG.append('rect')
      //         .attr('x', 0)
      //         .attr('y', 0)
      //         .attr('width', treeWidth)
      //         .attr('height', treeHeight)
      //         .attr('fill', 'pink')
      
    })

    function asc(a, b) {
      return a['AQI'] - b['AQI'];
    }

    function patternSupDesc(a, b) {
      if (b['sup'] === a['sup']) return b['total_occur'] - a['total_occur']
      else return b['sup'] - a['sup']
    }

    function patternCntDesc(a, b) {
      if (b['total_occur'] === a['total_occur']) return b['sup'] - a['sup']
      else return b['total_occur'] - a['total_occur']
    }

    function getDaysBetween(dateString1, dateString2) {
      const  startDate_t = Date.parse(dateString1);
      const  endDate_t = Date.parse(dateString2);
      const days = (endDate_t - startDate_t)/(1*24*60*60*1000);
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
              if (stateObj.focused_level !== -1 && stateObj.focused_level !== i) return '#cecece'
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
      // let vinlinHeight = document.getElementsByClassName('gridCircle')[0].getAttribute('r') * 1;
      let vinlinHeight = realRadius
      const maxScale = d3.scaleLinear().domain([0, 500]).range([5, vinlinHeight])
      let axisWrapper = d3.selectAll('.radar-container .axisWrapper')
      for (let i = 0; i < center_data.length; ++i) {
        let cluster_max = max_iaqi[i]
        // console.log(cluster_max);
        // console.log(cluster_dis_verteces);
        let oneAxisWrapper = d3.select(axisWrapper._groups[0][getOrderLevelID(i)])
        // 轴上画小提琴图
        let axisg = oneAxisWrapper.selectAll('.axis')
            .append('rect')
            .attr('x', -3)
            .attr('y', (d,index) => {
              let tmpMax
              if (cluster_max[index] > 500) cluster_max[index] = 500
              else tmpMax = cluster_max[index]
              return maxScale(tmpMax)
            })
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
      // console.log(stateObj.selCityList);
      // console.log(clusterItemList);
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
      // console.log(levelCityList);

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

    function angle(start, end) {
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
                let xDis = existPointsList[j].x - pointOrderList[i].x
                let yDis = existPointsList[j].y - pointOrderList[i].y
                let tmpAngle = angle(existPointsList[j], pointOrderList[i])
                let xNeed = xDis * rDis / tmpDis
                let yNeed = yDis * rDis / tmpDis
                pointOrderList[i].x = existPointsList[j].x + xNeed
                pointOrderList[i].y += existPointsList[j].y + yNeed
                if (pointOrderList[i].x > circleD / 2 * 0.7) pointOrderList[i].x = circleD / 2 * 0.7
                if (pointOrderList[i].x < -circleD / 2 * 0.7) pointOrderList[i].x = -circleD / 2 * 0.7
                if (pointOrderList[i].y > circleD / 2 * 0.7) pointOrderList[i].y = circleD / 2 * 0.7
                if (pointOrderList[i].y < -circleD / 2 * 0.7) pointOrderList[i].y = -circleD / 2 * 0.7
                break
              }
            }
            tmpCnt += 1
            if (cluterFlag === 0) break
          }
          existPointsList.push(pointOrderList[i])
        }
      }
      for (let i = 0; i < existPointsList.length; ++i) {
        let tmpIndex = existPointsList[i].orginal_id
        xCoord[tmpIndex] = existPointsList[i].x
        yCoord[tmpIndex] = existPointsList[i].y
      }
    }

    function cluterHandleMtx (detect_scale) {
      let rDetect = circleItemR * detect_scale / 0.7
      let rDis = rDetect * 2
      let center = [0, 0]
      let pointOrderList = []
      for (let i = 0; i < xCoord.length; ++i) {
        let tmpDis = distance(center[0], center[1], xCoord[i], yCoord[i])
        let tmpAngle = angle(center, [xCoord[i], yCoord[i]])
        pointOrderList.push({'x': xCoord[i], 'y': yCoord[i], 'dis': tmpDis, 'angle': tmpAngle, 'orginal_id': i})
      }
      pointOrderList.sort((a, b) => a['dis'] - b['dis'])
      // console.log(pointOrderList);
      let pointGrid = []
      let locGrid = []
      let gridLen = Math.ceil(circleD / rDis)
      let gridUnit = circleD / gridLen
      // console.log(gridLen);
      for (let i = 0; i < gridLen+1; ++i) {
        pointGrid.push([])
        locGrid.push([])
        for (let j = 0; j < gridLen+1; ++j) {
          pointGrid[i].push(-1)
          let gridX = -circleD/2 + i * gridUnit
          let gridY = -circleD/2 + j * gridUnit
          locGrid[i].push([gridX, gridY])
        }
      }
      // console.log(pointGrid);
      // console.log(locGrid);
      for (let i = 0; i < pointOrderList.length; ++i) {
        let realID = pointOrderList[i].orginal_id
        let pointX = pointOrderList[i].x
        let pointY = pointOrderList[i].y
        let pointlocX = Math.round((pointX + circleD/2) / gridUnit)
        let pointlocY = Math.round((pointY + circleD/2) / gridUnit)

        let okFlag = 0
        // 如果距离最近的网格点没有数据，则放置再此处，否则放置在外侧方向距离最近的所有没数据的网格点
        if (pointGrid[pointlocX][pointlocY] === -1) {
          pointGrid[pointlocX][pointlocY] = realID
          // console.log(pointGrid);
          xCoord[realID] = locGrid[pointlocX][pointlocY][0]
          yCoord[realID] = locGrid[pointlocX][pointlocY][1]
          okFlag = 1
        }
        else {
          let tmpMinDis = 1000000
          let tmpMinLoc = [-1, -1]
          for (let j = 0; j < gridLen+1; ++j) {
            for (let k = 0; k < gridLen+1; ++k) {
              if (pointGrid[j][k] !== -1) continue

              let tmp_dis = distance(locGrid[j][k][0], locGrid[j][k][1], pointX, pointY)
              if (tmp_dis < tmpMinDis) {
                tmpMinDis = tmp_dis
                tmpMinLoc = [j, k]
              }
            }
          }
          pointGrid[tmpMinLoc[0]][tmpMinLoc[1]] = realID
          xCoord[realID] = locGrid[tmpMinLoc[0]][tmpMinLoc[1]][0]
          yCoord[realID] = locGrid[tmpMinLoc[0]][tmpMinLoc[1]][1]
          okFlag = 1
        }
        if (okFlag === 0) console.log('hai mei hao shi');
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
        .innerRadius(circleItemR * 1.05)
        .outerRadius(circleItemR * 1.25)
        .startAngle(Math.PI * 0.2)
        .endAngle(Math.PI * 0.8);
      
      const leftArc = d3.arc()
        .innerRadius(circleItemR * 1.05)
        .outerRadius(circleItemR * 1.25)
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
          .attr('stroke', '#bbb')
      let circleItemRegion = circleRegion.append('g')
          .attr('class', 'circleItem')
          .selectAll('circle')
          .data(stateObj.selectedLocs)
          .join('g')
            .attr('label-id', (d, i) => i)
            .attr('class', 'circleItemRegion')
            .attr("transform", (d, i) => `translate(${xCoord[i]*0.707 + colWidth/2}, ${yCoord[i]*0.707 + rowHeight/2})`)
      let smallCircle = circleItemRegion.append('circle')
          .attr('r', circleItemR*0.95)
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('fill', '#bbb')
          .attr('city-name', (d,i) => stateObj.selCityList[i])
          .style("cursor", "pointer")
      circleItemRegion.append('path')
          .attr('class', 'leftArc')
          .attr('d', leftArc)
      circleItemRegion.append('path')
          .attr('class', 'rightArc')
          .attr('d', rightArc)
      smallCircle.on('mouseover', (e, d) => {
        // console.log(e);
        // console.log(d3.select(e.path[0]).attr('city-name'));
        var xPosition = e.pageX;
        var yPosition = e.pageY;
        //Update the tooltip position and value
        d3.select("#tooltip")
            .style("left", xPosition + 5  +"px")
            .style("top", yPosition - 22 + "px")
            .text(d3.select(e.path[0]).attr('city-name'));
        //Show the tooltip
        d3.select("#tooltip").classed("hidden", false);
      }).on("mouseout", (e, d) => {
        d3.select("#tooltip").classed("hidden", true);
      }).on('click', (e, d) => {
        if (stateObj.focused_city === d3.select(e.path[0]).attr('city-name')) {
          store.commit('setData', {
            field: 'focused_city',
            data: 'None'
          })   
        } else {
          store.commit('setData', {
            field: 'focused_city',
            data: d3.select(e.path[0]).attr('city-name')
          })
        }
      })

      
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
                // console.log(d,k);
                if (linkSelFlag.value > 0) {
                  if (!((j === selectedLink.dateIndex && i === selectedLink.source) || (j === selectedLink.dateIndex+1 && i === selectedLink.target))) {
                    return '#bbb'
                  }
                  else if (d.exist === 1) {
                    if ((j === selectedLink.dateIndex && i === selectedLink.source && d.post === selectedLink.target) || (j === selectedLink.dateIndex + 1 && i === selectedLink.target && d.pre === selectedLink.source)) {
                      let tmpAQI = centerInfor[i]['AQI']
                      if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                      else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                      else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                      else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                      else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                    }
                    else return '#5c9fc9'
                  } else if (d.exist === 0) return '#bbb'
                }
                if (patternFocusFlag.value === true) {
                  let curGlobalDateIdx = sDateIndex + j
                  let inPatternRegFlag = false, inPatternCityFlag = false
                  for (let l = 0; l < focusedPatternSeq.length; ++l) {
                    // console.log(curGlobalDateIdx, focusedPatternSeq[l].dateIdx);
                    if (curGlobalDateIdx === focusedPatternSeq[l].dateIdx && i === Number(focusedPatternSeq[l].source)) {  
                      inPatternRegFlag = true
                      // let curCityName = d3.select(circleItem.selectAll('.circleItemRegion circle')._groups[0][k]).attr('city-name')
                      // let cityIdx = getArrayIndex(stateObj.selCityList, curCityName)
                      // console.log(stateObj.selCityList);
                      if (focusedPatternSeq[l].cityList.indexOf(k) !== -1 && (d.post === Number(focusedPatternSeq[l].target) || focusedPatternSeq[l].target === -1)) {
                        inPatternCityFlag = true
                        let tmpAQI = centerInfor[i]['AQI']
                        if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                        else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                        else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                        else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                        else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                      }
                    }
                  }
                  if (!inPatternRegFlag) return '#bbb'
                  if (inPatternRegFlag && !inPatternCityFlag) {
                    if (d.exist === 0) return '#bbb'
                    else return '#5c9fc9' 
                  }
                }
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
                if (linkSelFlag.value > 0) {
                  if (!((j === selectedLink.dateIndex && i === selectedLink.source) || (j === selectedLink.dateIndex+1 && i === selectedLink.target))) {
                    return 0
                  } else if (d.exist === 1) {
                    if (j === selectedLink.dateIndex && i === selectedLink.source && d.post === selectedLink.target) return 1
                    if (j === selectedLink.dateIndex + 1 && i === selectedLink.target && d.pre === selectedLink.source) return 1
                    return 0
                    // if (j === selectedLink.dateIndex && d.post !== selectedLink.target) return 0
                    // else if (j === selectedLink.dateIndex + 1 && d.pre !== selectedLink.source) return 0
                    // else return 1
                  } else if (d.exist === 0) return 0
                }
                if (patternFocusFlag.value === true) {
                  let curGlobalDateIdx = sDateIndex + j
                  let inPatternRegFlag = false, inPatternCityFlag = false
                  for (let l = 0; l < focusedPatternSeq.length; ++l) {
                    // console.log(curGlobalDateIdx, focusedPatternSeq[l].dateIdx);
                    if (curGlobalDateIdx === focusedPatternSeq[l].dateIdx && i === Number(focusedPatternSeq[l].source)) {  
                      inPatternRegFlag = true
                      if (focusedPatternSeq[l].cityList.indexOf(k) !== -1 && (d.post === Number(focusedPatternSeq[l].target) || focusedPatternSeq[l].target === -1)) {
                        inPatternCityFlag = true
                        return 1
                      }
                    }
                  }
                  return 0
                }
                if (stateObj.focused_city != 'None' && stateObj.selCityList[k] !== stateObj.focused_city) return 0
                else return d.exist
              })
              .attr('stroke', (d, k) => {
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
                if (linkSelFlag.value > 0) {
                  if (!((j === selectedLink.dateIndex && i === selectedLink.source) || (j === selectedLink.dateIndex+1 && i === selectedLink.target))) {
                    return 0
                  } else if (d.exist === 1) {
                    if (j === selectedLink.dateIndex && i === selectedLink.source && d.post === selectedLink.target) return 1
                    if (j === selectedLink.dateIndex + 1 && i === selectedLink.target && d.pre === selectedLink.source) return 1
                    return 0
                    // else if (j === selectedLink.dateIndex + 1 && d.pre !== selectedLink.source) return 0
                    // else return 1
                  } else if (d.exist === 0) return 0
                }
                if (patternFocusFlag.value === true) {
                  let curGlobalDateIdx = sDateIndex + j
                  let inPatternRegFlag = false, inPatternCityFlag = false
                  for (let l = 0; l < focusedPatternSeq.length; ++l) {
                    // console.log(curGlobalDateIdx, focusedPatternSeq[l].dateIdx);
                    if (curGlobalDateIdx === focusedPatternSeq[l].dateIdx && (d.post === Number(focusedPatternSeq[l].target) || focusedPatternSeq[l].target === -1)) {  
                      inPatternRegFlag = true
                      if (focusedPatternSeq[l].cityList.indexOf(k) !== -1 && d.post === Number(focusedPatternSeq[l].target)) {
                        inPatternCityFlag = true
                        return 1
                      }
                    }
                  }
                  return 0
                }
                if (stateObj.focused_city != 'None' && stateObj.selCityList[k] !== stateObj.focused_city) return 0
                else return d.exist
              })
              .attr('stroke', (d, k) => {
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
      d3.select('.radar-container').remove()

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
      violin(radarRegion, centerInfor.map(item=>item.point), centerInfor.map(item=>item.AQI), aqiColorScheme, curLabelNum, lenScale, varNames, clusterInfo['iaqi_max'], circleD)

      radarRegion.on('click', function(e, d) {
        let className = d3.select(e.path[2]).attr('class')
        if (className.substring(0, 10) != 'flow-radar') return
        let level_id = Number(className[10])
        console.log(level_id);
        store.commit('setData', {
          field: 'focused_level',
          data: level_id
        })
      })
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
        .domain([1, stateObj.selCityList.length])
        .range([4, circleD * 0.95])
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
              if (linkSelFlag.value > 0) {
                if (d !== selectedLink) return "#cecece"
              }
              if (patternFocusFlag.value === true) return "#cecece"
              if (stateObj.focused_level !== -1 && d.source !== stateObj.focused_level && d.target !== stateObj.focused_level) return "#cecece"
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
              if (linkSelFlag.value > 0) {
                // console.log(d, selectedLink);
                if (d !== selectedLink) return 0.4
              }
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
            .attr("stroke-width", d => {
              if (d.count === 0) return 0
              return curveWidth(d.count)
            })
            .style("cursor", "pointer")
            .on('click', (e,d) => {
              if (linkSelFlag.value === 0) {
                linkSelFlag.value += 1
                selectedLink = d
                // console.log(e, d)
              } else {
                if (selectedLink === d) {
                  linkSelFlag.value = 0
                  selectedLink = {}
                } else {
                  linkSelFlag.value += 1
                  selectedLink = d
                }
              }
            })
      
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
              if (patternFocusFlag.value === true) {
                let curGlobalDateIdx = sDateIndex + d.dateIndex
                for (let i = 0; i < focusedPatternSeq.length; ++i) {
                  if (curGlobalDateIdx === focusedPatternSeq[i].dateIdx && d.source === Number(focusedPatternSeq[i].source) && d.target === Number(focusedPatternSeq[i].target)) {
                    return curveGenerator({source: {y: sourceX, x: sourceY}, target: {y: targetX, x: targetY}})
                  }
                }
              }
              return ""
            })
            .attr('fill', 'none')
            .attr("stroke", d => {
              if (patternFocusFlag.value === true) {
                // console.log(d);
                let curGlobalDateIdx = sDateIndex + d.dateIndex
                // console.log(curGlobalDateIdx);
                for (let i = 0; i < focusedPatternSeq.length; ++i) {
                  // if (curGlobalDateIdx < focusedPatternSeq[i].dateIdx) break
                  if (curGlobalDateIdx === focusedPatternSeq[i].dateIdx && d.source === Number(focusedPatternSeq[i].source) && d.target === Number(focusedPatternSeq[i].target)) {
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
                }
              }
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
              if (patternFocusFlag.value === true) {
                let curGlobalDateIdx = sDateIndex + d.dateIndex
                for (let i = 0; i < focusedPatternSeq.length; ++i) {
                  if (curGlobalDateIdx === focusedPatternSeq[i].dateIdx && d.source === Number(focusedPatternSeq[i].source) && d.target === Number(focusedPatternSeq[i].target)) {
                    return 0.95
                  }
                }
              }
              return 0
            })
            .attr("stroke-width", d => {
              if (patternFocusFlag.value === true) {
                let curGlobalDateIdx = sDateIndex + d.dateIndex
                let totalCnt = 0
                for (let i = 0; i < focusedPatternSeq.length; ++i) {
                  // if (curGlobalDateIdx < focusedPatternSeq[i].dateIdx) break
                  if (curGlobalDateIdx === focusedPatternSeq[i].dateIdx && d.source === Number(focusedPatternSeq[i].source) && d.target === Number(focusedPatternSeq[i].target)) {
                    // console.log(focusedPatternSeq[i].count);
                    totalCnt += focusedPatternSeq[i].count
                  }
                }
                if (totalCnt === 0) return 0
                return curveWidth(totalCnt)
              }
              return curveWidth(1)
            })
    }

    function drawIcicle() {
      d3.select('.icicle').remove()
      if (start_label.value >= vmsp_pattern.label_trees.length) return
      // console.log(vmsp_pattern.label_trees[start_label.value]);
      let partition = data => d3.partition()
        .size([treeWidth, treeHeight])
        .padding(1)
      let root = d3.hierarchy(vmsp_pattern.label_trees[start_label.value])
        .sum(d => d.pattern_num)
        .sort((a, b) => b.height - a.height || b.value - a.value)
      const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, vmsp_pattern.label_trees[start_label.value].children.length + 1))
      const par = partition(root)
      par(root)
      let focus = root;
      document.oncontextmenu = function(event){
        event.preventDefault();
      };
      // console.log(root.descendants());
      const icicle = treeSVG.append('g').attr('class', 'icicle')
      const cell = icicle
        .selectAll("g")
        .data(root.descendants())
        .join("g")
          .attr("transform", d => `translate(${d.x0},${d.y0})`);
      const rect = cell.append("rect").attr('class', 'icicle-rect')
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill-opacity", 0.6)
        .attr("fill", d => {
          if (d.data.label === -1) return '#cdcdcd';
          let tmpAQI = centerInfor[d.data.label]['AQI']
          if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
          else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
          else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
          else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
          else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
        })
        .style("cursor", "pointer")
        .on('mousedown', (e,p) => {
          if (e.button === 0) {
            let coverBarWidth = 72
            d3.selectAll('.pattern-trend-view > *').remove()
            d3.selectAll('.pattern-cover-view > *').remove()
            // console.log(p.data);
            let targetItem = e.path[0]
            d3.selectAll('.icicle-rect').attr('stroke', '#fff')
            d3.selectAll('.icicle-rect').attr('stroke-width', 0)
            d3.select(targetItem).attr('stroke', '#62a2cb')
            d3.select(targetItem).attr('stroke-width', 2)
            drawDetail = true
            let pattern_index_list = p.data.pattern_list
            selPatternList.value = []
            selPatternInfo = []
            for (let i = 0; i < pattern_index_list.length; ++i) {
              let curPatternData = vmsp_pattern.label_patterns[start_label.value][pattern_index_list[i]]
              let curPattern = curPatternData.pattern
              let curPatternLength = curPatternData.pattern.length
              // curPattern = curPattern.split("").join(" ")
              selPatternInfo.push(curPatternData)
              let curTotalOccurCnt = 0
              for (let j = 0; j < curPatternData.occur.length; ++j) {
                curTotalOccurCnt += curPatternData.occur[j].count
              }
              selPatternInfo[i]['total_occur'] = curTotalOccurCnt
              // let curSpaceCover, curTimeCover
              // curSpaceCover = 1.0 * curPatternData.sup / cityNum
              // let timeFlagList = new Array(totalDayNum).fill(0)
              // for (let j = 0; j < curPatternData.occur.length; ++j) {
              //   for (let k = 0; k < curPatternData.occur[j].length; ++k) {
              //     for (let l = 0; l < curPatternLength; ++l) {
              //       if (timeFlagList[curPatternData.occur[j][k]+l] === 0) {
              //         timeFlagList[curPatternData.occur[j][k]+l] = 1
              //         curTimeCover += 1
              //       }
              //     }
              //   }
              // }
              // curTimeCover = 1.0 * curTimeCover / totalDayNum
              // let curSpaceCoverWidth = curSpaceCover * coverBarWidth
              // let curTimeCoverWidth = curTimeCover * coverBarWidth
              // $(`.space-cover:eq(${i})`).css('width', `${curSpaceCoverWidth}px`)
              // $(`.time-cover:eq(${i})`).css('width', `${curTimeCoverWidth}px`)
            }
            if (sort_flag.value === 'sup') selPatternInfo.sort(patternSupDesc)
            if (sort_flag.value === 'cnt') selPatternInfo.sort(patternCntDesc)
            for (let i = 0; i < selPatternInfo.length; ++i) {
              selPatternList.value.push(selPatternInfo[i].pattern)
            }
            patternFocusFlag.value = false
            focused_pattern.value = {}
            $(`.detail-pattern-card`).removeClass('card-selected')
            // console.log(selPatternInfo);
          } else if (e.button === 2) {
            if (p.parent === null) return
            focus = focus === p ? p = p.parent : p;
            root.each(d => {
              // console.log(d);
              // console.log(p);
              return d.target = {
                x0: (d.x0 - p.x0) / (p.x1 - p.x0) * treeWidth,
                x1: (d.x1 - p.x0) / (p.x1 - p.x0) * treeWidth,
                y0: d.y0 - p.y0,
                y1: d.y1 - p.y0
              }
            });
            const t = cell.transition().duration(500)
                .attr("transform", d => `translate(${d.target.x0},${d.target.y0})`);
            rect.transition(t).attr("width", d => rectWidth(d.target));
          }
        })

        function rectWidth(d) {
          // return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
          return d.x1 - d.x0
        }
    }

    function drawPatternTrend() {
      d3.selectAll('.pattern-trend-view > *').remove()
      patternTrendSVG = d3.selectAll('.pattern-trend-view')
              // .append('svg').attr('class', 'pattern-trend-view')
              .attr('width', patternTrendWidth)
              .attr('height', patternTrendHeight)
      // 画各个类别的轴线（虚线）
      let clusterID_list = []
      for (let i = 0; i < clusterNum; ++i) {
        clusterID_list.push(i)
      }
      let padding_trend = [16, 8] // 上下、左右
      let trend_line_height = (patternTrendHeight - padding_trend[0] * 2) /  (clusterNum - 1)
      let clusterLines = patternTrendSVG.append('g').attr('class', 'cluster-lines')
              .selectAll('.cluster-line')
              .data(clusterID_list)
              .join('line')
                .attr('class', 'cluster-line')
                .attr('x1', padding_trend[1])
                .attr('y1', (d,i) => padding_trend[0] + i * trend_line_height)
                .attr('x2', patternTrendWidth - padding_trend[1])
                .attr('y2', (d,i) => padding_trend[0] + i * trend_line_height)
                .attr("stroke", '#cecece')
      for (let index = 0; index < selPatternList.value.length; ++index) {
        let trend_circle_gap = (patternTrendWidth - padding_trend[1] * 2) / (selPatternList.value[index].length - 1)
        let patternLinks = d3.select(patternTrendSVG._groups[0][index])
              .append('g').attr('class', 'pattern-links')
              .selectAll('.pattern-link')
              .data(selPatternList.value[index])
              .join('line')
                .attr('x1', (d,i) => padding_trend[1] + i * trend_circle_gap)
                .attr('y1', (d,i) => padding_trend[0] + d * trend_line_height)
                .attr('x2', (d,i) => {
                  if (i === selPatternList.value[index].length - 1) return padding_trend[1] + i * trend_circle_gap
                  else return padding_trend[1] + (i+1) * trend_circle_gap
                })
                .attr('y2', (d,i) => {
                  if (i === selPatternList.value[index].length - 1) return padding_trend[0] + d * trend_line_height
                  else return padding_trend[0] + selPatternList.value[index][i+1] * trend_line_height
                })
                .attr('stroke', '#62a2cb')
        let patternCircles = d3.select(patternTrendSVG._groups[0][index])
              .append('g').attr('class', 'pattern-circles')
              .selectAll('.pattern-circle')
              .data(selPatternList.value[index])
              .join('circle')
                .attr('cx', (d,i) => padding_trend[1] + i * trend_circle_gap)
                .attr('cy', (d,i) => padding_trend[0] + d * trend_line_height)
                .attr('r', 6)
                .attr('fill', (d,i) => {
                  let tmpAQI = centerInfor[d]['AQI']
                  if (tmpAQI >= 0 && tmpAQI <= 50) return aqiColorScheme[0](tmpAQI)
                  else if (tmpAQI > 50 && tmpAQI <= 150) return aqiColorScheme[1](tmpAQI)
                  else if (tmpAQI > 150 && tmpAQI <= 200) return aqiColorScheme[2](tmpAQI)
                  else if (tmpAQI > 200 && tmpAQI <= 300) return aqiColorScheme[3](tmpAQI)
                  else if (tmpAQI > 300) return aqiColorScheme[4](tmpAQI)
                })
      }
      
    }

    function drawPatternCover() {
      d3.selectAll('.pattern-cover-view > *').remove()
      patternCoverSVG = d3.selectAll('.pattern-cover-view')
              // .append('svg').attr('class', 'pattern-cover-view')
              .attr('width', patternCoverWidth)
              .attr('height', patternCoverHeight)
      // 画圆圈
      let coverCircleR = 36
      // patternCoverSVG.append('g').attr('class', 'cover-circle-outer')
      //         .append('circle')
      //         .attr('cx', patternCoverWidth / 2)
      //         .attr('cy', patternCoverHeight / 2)
      //         .attr('r', coverCircleR + 13)
      //         .attr('stroke', '#9c9c9c')
      //         .attr('fill', 'none')
      let coverCircles = patternCoverSVG.append('g').attr('class', 'cover-circle')
              .append('circle')
              .attr('cx', patternCoverWidth / 2)
              .attr('cy', patternCoverHeight / 2)
              .attr('r', coverCircleR)
              .attr('stroke', '#9c9c9c')
              .attr('fill', 'none')
      // 画外圆环
      let cityDensity = new Array(selPatternInfo.length)
      timeDensity = new Array(selPatternInfo.length)
      occurPos = new Array(selPatternInfo.length)
      allPatternSeq = new Array(selPatternInfo.length)
      patternSeqCityList = new Array(selPatternInfo.length)
      let timeArcData = new Array(totalDayNum).fill(1)
      for(let i = 0; i < selPatternInfo.length; ++i) {
        timeDensity[i] = new Array(totalDayNum)
        cityDensity[i] = new Array(cityNum)
        occurPos[i] = new Array(totalDayNum)
        patternSeqCityList[i] = new Array(totalDayNum)
        allPatternSeq[i] = []
        for (let j = 0; j < totalDayNum; ++j) {
          timeDensity[i][j] = 0;
          occurPos[i][j] = 0;
          patternSeqCityList[i][j] = []
        }
        for (let j = 0; j < cityNum; ++j) {
          cityDensity[i][j] = 0
        }
      }
      // console.log(selPatternInfo);
      for (let i = 0; i < selPatternInfo.length; ++i) {
        let sid_list = selPatternInfo[i].sid.split(" ")
        sid_list.shift()
        for (let j = 0; j < selPatternInfo[i].occur.length; ++j) {
          cityDensity[i][j] = selPatternInfo[i].occur[j].count
          for (let k = 0; k < selPatternInfo[i].occur[j].pos_list.length; ++k) {
            occurPos[i][selPatternInfo[i].occur[j].pos_list[k]] += 1
            patternSeqCityList[i][selPatternInfo[i].occur[j].pos_list[k]].push(j)
            for (let l = 0; l < selPatternInfo[i].pattern.length; ++l)
              timeDensity[i][selPatternInfo[i].occur[j].pos_list[k] + l] += 1
          }
        }
      }
      for (let i = 0; i < selPatternInfo.length; ++i) {
        for (let j = 0; j < totalDayNum; ++j) {
          if (occurPos[i][j] !== 0) {
            for (let k = 0; k < selPatternInfo[i].pattern.length; ++k) {
              if (k !== selPatternInfo[i].pattern.length - 1) {
                let patternSeqObj = {dateIdx: (j+k), source: selPatternInfo[i].pattern[k], target: selPatternInfo[i].pattern[k+1], count: occurPos[i][j], cityList: patternSeqCityList[i][j]}
                allPatternSeq[i].push(patternSeqObj)
              } else {
                let patternSeqObj = {dateIdx: (j+k), source: selPatternInfo[i].pattern[k], target: -1, count: occurPos[i][j], cityList: patternSeqCityList[i][j]}
                allPatternSeq[i].push(patternSeqObj)
              }
              
            }
          }
        }
      }
      let week_span = Math.floor(totalDayNum / 24) 
      let coverWeekNum = Math.ceil(totalDayNum / week_span)
      let timeDensity_week = new Array(selPatternInfo.length)
      let timeArcData_week = new Array(coverWeekNum).fill(1)
      for (let i = 0; i < selPatternInfo.length; ++i) {
        timeDensity_week[i] = new Array(coverWeekNum)
        for (let j = 0; j < coverWeekNum; ++j) {
          timeDensity_week[i][j] = 0
          for (let k = 0; k < week_span; ++k) {
            if (j*week_span+k === totalDayNum) break
            timeDensity_week[i][j] += timeDensity[i][j*week_span+k]
          }
        }
      }
      // console.log(selPatternInfo);
      // console.log(timeDensity);
      const coverInnerRadius = coverCircleR
      const coverOuterRadius = coverCircleR + 12
      const pie = d3.pie().value(d => d)
      const pieData = pie(timeArcData_week)
      // const pieData = pie(timeArcData)
      const arc = d3.arc()
        .innerRadius(coverInnerRadius)
        .outerRadius(coverOuterRadius);
      for (let i = 0; i < selPatternInfo.length; ++i) {
        const timeCoverColor = d3.scaleLinear()
                .domain([1, Math.max(...timeDensity_week[i])])
                // .range(['#b8e2b1', '#0d7835'])
                .range(['#9dbad9', '#05649c'])
        let timeCoverRing = d3.select(patternCoverSVG._groups[0][i]).append('g').attr('class', 'cover-ring')
          .selectAll('g')
          .data(pieData)
          .join('g')
          .attr('transform', `translate(${patternCoverWidth / 2},${patternCoverHeight / 2})`)
        timeCoverRing.append('path')
          .attr('fill', (d,j) => {
            // if (timeDensity[i][j] === 0) return '#fff'
            // else return timeCoverColor(timeDensity[i][j])
            if (timeDensity_week[i][j] === 0) return '#fff'
            else return timeCoverColor(timeDensity_week[i][j])
          })
          .attr('d', (d,j) => arc(d))
          .attr('stroke', (d,j) => {
            // if (timeDensity_week[i][j] === 0) return '#fff'
            // else return timeCoverColor(timeDensity_week[i][j])
            return '#dedede'
          })
        // 画圆内点
        let spaceCoverColor = d3.scaleLinear()
                .domain([1, Math.max(...cityDensity[i])])
                .range(['#9dbad9', '#05649c'])
        let spaceCoverPoints = d3.select(patternCoverSVG._groups[0][i]).append('g').attr('class', 'cover-points')
                .selectAll('circle')
                .data(stateObj.selectedLocs)
                .join('circle')
                  .attr("transform", (d, j) => `translate(${xCoord[j] * 0.6 * (coverCircleR*2) / circleD + patternCoverWidth/2}, ${yCoord[j] * 0.6 * (coverCircleR*2) / circleD + patternCoverHeight/2})`)
                  .attr('cx', 0).attr('cy', 0)
                  .attr('r', 3.6)
                  .attr('fill', (d,j) => {
                    if (cityDensity[i][j] === 0) return '#bbb'
                    else return spaceCoverColor(cityDensity[i][j])
                  })
                  .attr('stroke', '#fff')
      }
    }

    function drawTimeSlider() {
      d3.select('.timeSliderRegion').remove()
      console.log('drawTimeSlider', sDate);
      // 画时间拖拽控件
      timeSlider = svg.append('g').attr('class', 'timeSliderRegion')
      let timeSliderBg = timeSlider
            .append('rect')
              .attr('x', radarRegionWidth)
              .attr('y', height-timeBarHeight)
              .attr('width', flowRegionWidth)
              .attr('height', timeBarHeight)
              .attr('fill', 'none')
              .attr('stroke', "#333")
      patterOccurRegion = timeSlider.append('g').attr('class', 'pattern-occur-highlight')

      let timeBarTicks = timeSlider.append('g')
      
      let sliderWidth = 14.0 / totalDayNum * (flowRegionWidth-2)
      sliderXScale = d3.scaleTime()
            .domain([startDate, endDate.getTime() - 13*24*60*60*1000])
            .range([radarRegionWidth+1, width-1-sliderWidth])
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
              .on('click', (e) => {
                // console.log(e);
                let unit = (flowRegionWidth-2) / totalDayNum
                let newSliderX = e.offsetX
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
                // d3.select('.slider-rect')
                //     .attr('x', sliderXScale(sDate))
                // drawTimeSlider()
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
        // d3.select('.slider-rect')
        //     .attr('x', sliderXScale(sDate))
        // drawTimeSlider()
      })
      console.log(sDate);
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
    }

    onUpdated(() => {
      // console.log('upupupup');
      if (drawDetail || sort_change) {
        drawPatternTrend()
        drawPatternCover()
        for (let i = 0; i < selPatternInfo.length; ++i) {
          $(`.sup-val:eq(${i})`).text(`#Sup: ${selPatternInfo[i].sup}`)
          $(`.cnt-val:eq(${i})`).text(`#Count: ${selPatternInfo[i].total_occur}`)
        }
        if (sort_change && patternFocusFlag.value) {
          $(`.detail-pattern-card`).removeClass('card-selected')
          for (let i = 0; i < selPatternInfo.length; ++i) {
            if (focused_pattern.value.pattern === selPatternInfo[i].pattern)
              $(`.detail-pattern-card:eq(${i})`).addClass('card-selected')
          }
        }
        drawDetail = false
        sort_change = false
      }
    })

    watch (() => stateObj.selTime.end, (oldVlaue, newValue) => {
      endDate = new Date(stateObj.selTime.end)
    })

    watch (() => stateObj.selTime.start, (oldVlaue, newValue) => {
      startDate = new Date(stateObj.selTime.start)
    })
    
    watch (() => stateObj.focused_level, (oldVlaue, newValue) => {
      drawRadar()
      drawLink()
      drawCircles()
    })

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

    watch (() => linkSelFlag.value, (oldVlaue, newValue) => {
      drawLink()
      drawCircles()
    })

    watch (() => focused_pattern.value, (oldVlaue, newValue) => {
      // console.log(focused_pattern.value);
      // 重新画时间轴、并跳转到第一次出现模式的时间位置，重画全部
      // drawTimeSlider() -- 点击位置可直接跳转到对应时间位置；添加蓝色背景标识
      let firstPatternTime
      if (typeof(focused_pattern.value.pattern) === "undefined") return
      console.log(totalTimeDensity);
      for (let i = 0; i < totalTimeDensity.length; ++i) {
        if (totalTimeDensity[i] !== 0) {
          if (i > totalDayNum - 13) sDate.setTime(startDate.getTime() + (totalDayNum-14)*24*60*60*1000)
          else sDate.setTime(startDate.getTime() + i*24*60*60*1000)
          break
        }
      }
      processData()
      d3.select('.local-time-axis').remove()
      d3.select('.circleRegion').remove()
      d3.selectAll('.radar-container').remove()
      d3.select('.links').remove()
      drawRadar()
      drawTimeAxis()
      drawLink()
      drawCircles()
      // console.log(patternFocusFlag.value);
      if (patternFocusFlag.value === true) {
        let densityColor = d3.scaleLinear()
                .domain([1, Math.max(...totalTimeDensity)])
                // .range(['#b8e2b1', '#0d7835'])
                .range(['#9dbad9', '#05649c'])
        d3.selectAll('.pattern-occur-highlight rect').remove()
        // let patterOccurRegion = timeSlider.append('g').attr('class', 'pattern-occur-highlight')
        for (let i = 0; i < totalTimeDensity.length; ++i) {
          // console.log(totalTimeDensity[i]);
          if (totalTimeDensity[i] !== 0) {
            patterOccurRegion.append('rect')
              .attr('x', () => {
                let curDate = startDate.getTime() + i*24*60*60*1000
                return radarRegionWidth+1 + i * (flowRegionWidth - 2) / totalDayNum
              })
              .attr('y', (height - timeBarHeight + 1))
              .attr('width', (flowRegionWidth - 2) / totalDayNum)
              .attr('height', 13)
              .attr('fill', densityColor(totalTimeDensity[i]))
              // .attr('stroke', densityColor(totalTimeDensity[i]))
              // .attr('stroke-width', 0.5)
          }
        }
      }
      d3.select('.slider-rect')
          .attr('x', sliderXScale(sDate))
    })

    watch (() => patternFocusFlag.value, (oldVlaue, newValue) => {
      // console.log(focused_pattern.value);
      // 重新画时间轴、并跳转到起始时间位置，重画全部
      if (patternFocusFlag.value === false) {
        // console.log('patternFocusFlag change to false');
        // sDate.setTime(startDate.getTime())
        processData()
        d3.select('.local-time-axis').remove()
        d3.select('.circleRegion').remove()
        d3.selectAll('.radar-container').remove()
        d3.select('.links').remove()
        drawRadar()
        drawTimeAxis()
        drawLink()
        drawCircles()
        // drawTimeSlider()
        d3.selectAll('.pattern-occur-highlight rect').remove()
        // let patterOccurRegion = timeSlider.append('g').attr('class', 'pattern-occur-highlight')
        d3.select('.slider-rect')
          .attr('x', sliderXScale(sDate))
      }
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

    function processNode(node, l) {
      if (node.children.length !== 0) {
        // node.pattern_num = 0
        delete node.pattern_num
        for (let i = 0; i < node.children.length; ++i) {
          processNode(node.children[i], l)
        }
      }
      else {
        delete node.children
        // for (let i = 0; i < node.pattern_list.length; ++i) {
        //   childSeqList[l].push(node.pattern_list[i])
        // }
        return 
      }
    }

    watch (() => stateObj.vmsp_pattern, (oldVlaue, newValue) => {
      vmsp_pattern = stateObj.vmsp_pattern
      childSeqList = []
      notChildSeqList = []
      for (let i = 0; i < vmsp_pattern.label_trees.length; ++i) {
        childSeqList.push([])
        notChildSeqList.push([])
      }
      // console.log(childSeqList);
      for (let i = 0; i < vmsp_pattern.label_trees.length; ++i) {
        let curNode = vmsp_pattern.label_trees[i]
        // console.log(i);
        processNode(curNode, i)
      }
      // console.log(vmsp_pattern.label_trees);
      for (let i = 0; i < vmsp_pattern.label_patterns.length; ++i) {
        $(`.label-block:eq(${i})`).text(vmsp_pattern.label_patterns[i].length)
      }
      $(`.label-block:eq(${start_label.value})`).addClass('deep-border')

      patternFocusFlag.value = false
      focused_pattern.value = {}
      $(`.detail-pattern-card`).removeClass('card-selected')

      drawIcicle()
      // console.log(vmsp_pattern);
    })

    watch (() => start_label.value, (oldVlaue, newValue) => {
      drawIcicle()
      if (patternFocusFlag.value === true) {
        console.log('start label change -- false');
        patternFocusFlag.value = false
        focused_pattern.value = {}
        $(`.detail-pattern-card`).removeClass('card-selected')
      }
      selPatternList.value = []
      selPatternInfo = []
    })

    watch (() => sort_flag.value, (oldVlaue, newValue) => {
      if (sort_flag.value === 'sup') selPatternInfo.sort(patternSupDesc)
      if (sort_flag.value === 'cnt') selPatternInfo.sort(patternCntDesc)
      selPatternList.value = []
      for (let i = 0; i < selPatternInfo.length; ++i) {
        selPatternList.value.push(selPatternInfo[i].pattern)
      }
      sort_change = true
      
      // drawPatternTrend()
      // drawPatternCover()
    })

    watch (() => stateObj.clusteringResult, (oldVlaue, newValue) => {
      selPatternList.value = []
      selPatternInfo = []
      $("#evolutionFlow").empty();
      clusterInfo = stateObj.clusteringResult['cluster_info']
      clusterNum = stateObj.clusterNum
      clusterItemList = stateObj.clusteringResult['data']
      cityNum = stateObj.selCityList.length
      centerAQI = clusterInfo.centers.map(val => Math.max(...val))
      centerInfor = []
      startLabelList.value = []
      for (let i = 0; i < clusterNum; ++i) {
        startLabelList.value.push(i)
      }
      for (let i = 0; i < clusterNum; ++i) {
        centerInfor.push({'point': clusterInfo.centers[i], 'AQI': centerAQI[i], 'original_id': i})
      }
      centerInfor.sort(asc)
      startColorList.value = []
      for (let i = 0; i < clusterNum; ++i) {
        let tmpAQI = centerInfor[i]['AQI']
        let tmpColor
        if (tmpAQI >= 0 && tmpAQI <= 50) tmpColor = aqiColorScheme[0](tmpAQI)
        else if (tmpAQI > 50 && tmpAQI <= 150) tmpColor = aqiColorScheme[1](tmpAQI)
        else if (tmpAQI > 150 && tmpAQI <= 200) tmpColor = aqiColorScheme[2](tmpAQI)
        else if (tmpAQI > 200 && tmpAQI <= 300) tmpColor = aqiColorScheme[3](tmpAQI)
        else if (tmpAQI > 300) tmpColor = aqiColorScheme[4](tmpAQI)
        startColorList.value.push(tmpColor)
      }
      // console.log(startColorList.value);
      sDate = new Date(stateObj.selTime.start)
      totalDayNum = getDaysBetween(stateObj.selTime.start, stateObj.selTime.end) + 1
      curStackList = []
      console.log(totalDayNum, clusterNum);
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

      if (clusterNum <= 4) circleD = 74
      else if (clusterNum <= 6) circleD = 62
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
            .range([-circleD*0.5, circleD*0.5])
      yLocScale = d3.scaleLinear()
            .domain([Math.min(...yCoordStd), Math.max(...yCoordStd)])
            .range([circleD*0.5, -circleD*0.5])
      for (let i = 0; i < xLocList.length; ++i) {
        xCoord.push(xLocScale(xCoordStd[i]))
        yCoord.push(yLocScale(yCoordStd[i]))
      }

      // let cluter_flag = 1
      // while(cluter_flag === 1) {
      //   cluter_flag = cluterHandle()
      // }
      cluterHandleMtx(1.5)
      // cluterHandleMtx(2)

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
          let thisCityIndex = -1
          for (let k = 0; k < clusterItemList.length; ++k) {
            if (clusterItemList[k].city === tmp_city) {
              thisCityIndex = k
              break
            } else k += totalDayNum-1
          }
          let tmp_index = thisCityIndex + j
          let tmp_item = clusterItemList[tmp_index]
          temporalList.push(getOrderLevelID(tmp_item.label))
        }
        globalCityTemporalList[tmp_city] = temporalList
      }
      console.log(stateObj.selCityList);
      console.log(clusterItemList);
      // console.log(globalCityTemporalList);
      getData(store, 'vmsp_pattern', JSON.stringify(globalCityTemporalList), clusterNum)
      
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

      patternFocusFlag.value = false
      focused_pattern.value = {}
      $(`.detail-pattern-card`).removeClass('card-selected')
      drawTimeSlider() // 画时间拖拽控件
    })
    
    return {
      startLabelList,
      startColorList,
      start_label,
      selStartLabel,
      selPatternList,
      sort_flag,
      cardClickHandle
    }
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
  border-left: solid 1px #cdcdcd;
  width: 280px;
  height: 626px;
  /* background-color: #666; */
}

#evolutionFlow {
  display: block;
}

#tooltip {
  position: absolute;
  width: auto;
  height: auto;
  padding: 5px;
  background-color: #fff;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font: 400 12px 'Microsoft Yahei';
  border: solid 1px #cdcdcd
}

#tooltip.hidden {
  display: none;
}

.filter-region {
  border: solid 1px #cecece;
  border-radius: 5px;
  width: 260px;
  margin: 0 auto;
  margin-bottom: 8px;
  /* padding-top: 2px; */
}

.label-sel-region {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: 4px;
  /* border: solid 1px #cecece;
  border-radius: 5px; */
  /* width: 248px;
  margin: 0 auto; */
}

.tree-region {
  width: 260px;
  height: 160px;
  margin: 0 auto;
  margin-top: 4px;
  border: solid 1px #cecece;
  display: flex;
  justify-content: center;
  align-items: center;
}

#pattern-tree {
  width: 258px;
  height: 158px;
}

.label-block {
  width: 32px;
  height: 18px;
  border: solid 1px #dedede;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  font: normal 12px 'Microsoft Yahei';
  color: #fff;
}

.deep-border {
  height: 19px;
  border: solid 2px #62a2cb;
}

.detail-pattern {
  /* border-top: solid 1px #cecece; */
  width: 260px;
  height: 332px;
  margin: 0 auto;
  overflow-y: auto;
}

.detail-pattern-card {
  width: 250px;
  margin: 0 auto;
  margin-top: 6px;
}

.detail-pattern-block {
  height: 120px;
  width: 250px;
  /* margin: 0 auto; */
  /* margin-top: 4px; */
  text-align: center;
  font: normal 14px 'Microsoft Yahei';
  border: solid 1px #cecece;
  display: flex;
  justify-content: center;
  align-items: center;
  /* flex-wrap: wrap; */
}

.detail-pattern-card:first-of-type {
  margin-top: 2px;
}

.sub-title {
  width: 260px;
  margin: 0 auto;
  margin-top: 6px;
  text-align: left;
  /* margin-bottom: -4px; */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-btns {
  width: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

::-webkit-scrollbar{
  width: 7px;
  height: 7px;
  background-color: #F5F5F5;
}

/*定义滚动条轨道 内阴影+圆角*/
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  background-color: #F5F5F5;
}

/*定义滑块 内阴影+圆角*/
::-webkit-scrollbar-thumb{
  border-radius: 10px;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
  background-color: #c8c8c8;
}

.pattern-trend-region {
  height: 102px;
  width: 130px;
  border-right: solid 1px #dedede;
}

.pattern-cover-region {
  height: 102px;
  width: 120px;
}

.pattern-trend-view {
  height: 102px;
  width: 112px;
}

.pattern-cover-view {
  height: 102px;
  width: 102px;
}

.pattern-card-head {
  width: 250px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #ddd;
  font: normal 14px "Microsoft Yahei";
}

.sup-val,
.cnt-val {
  margin-left: 5px;
  text-align: left;
  flex-basis: 50%;
}

.card-selected {
  /* border: solid 1px #62a2cb; */
  box-shadow: 0 0 4px 2px #62a2cb;
  -webkit-box-shadow: 0 0 4px 2px #62a2cb;
}

.flow-interaction {
  position: absolute;
  left: 300px;
  top: 1020px;
}

#flow-refresh {
  font-size: 24px;
}

</style>