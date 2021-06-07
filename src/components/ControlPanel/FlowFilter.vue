<template>
  <div class="config-title">
    <span class="iconfont">&#xe6e5;</span> Flow Filtering & Setting
  </div>
  <div class="filter-region">
    <!-- <div>Trend Filter</div> -->
    <div class="trend-filter">
      Trend
      <div class="form-check">
        <input class="form-check-input" type="checkbox" v-model="filterCheck" value="up" id="flexCheck-up" @change="onCheckChange()">
        <label class="form-check-label" for="flexCheck-up">Up</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="checkbox" v-model="filterCheck" value="down" id="flexCheck-down" @change="onCheckChange()">
        <label class="form-check-label" for="flexCheck-down">Down</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="checkbox" v-model="filterCheck" value="stable" id="flexCheck-stable" @change="onCheckChange()">
        <label class="form-check-label" for="flexCheck-stable">Stable</label>
      </div>
    </div>
  </div>
  <div class="filter-region">
    <div>Change Level</div>
    <div class="span-filter">
      <div v-for="item in spanList" class="form-check">
        <input class="form-check-input" type="checkbox" v-model="spanFilterCheck" :value="item" @change="onSpanCheckChange()">
        <label class="form-check-label" for="flexCheck-up">{{ item }}</label>
      </div>
    </div>
  </div>
  <div class="filter-region">
    <div>City Number</div>
    <div class="range-container">
      <div id="count-start"></div>
      <div class="range-slider"></div>
      <div id="count-end"></div>
    </div>
  </div>
  <div class="filter-region">
    <div>Flow Color</div>
    <div class="color-sel-region">
      <div class="form-check">
        <input class="form-check-input" type="radio" name="flowColorRadio" id="flexRadioDefault1" value="Importance" v-model="flow_color" @change="onFlowColorChange()">
        <label class="form-check-label" for="flexRadioDefault1">Importance</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="flowColorRadio" id="flexRadioDefault2" value="Surprise" v-model="flow_color" @change="onFlowColorChange()">
        <label class="form-check-label" for="flexRadioDefault2">Surprise</label>
      </div>
    </div>
  </div>
  
  <!-- <div class="filter-region">
    <div class="range-container">
      <div class="sub-label">Importance</div>
      <input type="range" class="form-range" id="customRange1">
    </div>
  </div> -->
  <!-- <div class="filter-region">
    <div class="range-container">
      <div class="sub-label">Surprise</div>  
      <input type="range" class="form-range" id="customRange2">
    </div>
  </div> -->
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import $ from 'jquery'

export default {
  name: 'FlowFilter',
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value
    const cityNum = ref(0)

    let rangeVal
    let flow_color = ref('Importance')

    let filterCheck = ref(['up', 'down', 'stable'])
    let spanFilterCheck = ref(['0', '1', '2', '3', '4', '5'])
    let spanList = ref([])
    for (let i = 0; i < stateObj.clusterNum; ++i) {
      spanList.value.push(i.toString())
    }

    const onCheckChange = () => {
      console.log(filterCheck.value);
      store.commit('setData', {
        field: 'flow_filters',
        data: filterCheck
      })
    }

    const onSpanCheckChange = () => {
      console.log(spanFilterCheck);
      store.commit('setData', {
        field: 'span_filters',
        data: spanFilterCheck
      })
    }

    const onFlowColorChange = () => {
      store.commit('setData', {
        field: 'flow_color',
        data: flow_color
      })
    }

    watch (() => stateObj.selCityList, (oldVlaue, newValue) => {
      // console.log(stateObj.selCityList);
      cityNum.value = stateObj.selCityList.length
      $('.range-slider').remove()
      $('.slider-container').remove()
      let $div = $("<div class='range-slider'></div>");
      $('#count-start').after($div)
      $('.range-slider').jRange({
          from: 0,
          to: cityNum.value,
          step: 1,
          scale: [],
          format: '%s',
          width: '72%',
          showLabels: true,
          isRange : true,
          theme: "theme-blue",
          onstatechange: function() {
            rangeVal = $(".range-slider").val()
            // console.log(rangeVal);
            // console.log(rangeVal.split(',').map(item => Number(item)));
            store.commit('setData', {
              field: 'count_range',
              data: rangeVal.split(',').map(item => Number(item))
            })
          }
      });
      // console.log('aaaaaaaaaaa');
      $('.range-slider').jRange('setValue', `0,${cityNum.value}`);
      $('#count-start').text('0')
      $('#count-end').text(cityNum.value)
      $('.pointer-label').find('.high').text(cityNum.value)
      // console.log($('.pointer-label').find('.high').text);
      // console.log(stateObj.selCityList);
    })

    return {
      filterCheck,
      onCheckChange, 
      spanList,
      spanFilterCheck,
      onSpanCheckChange,
      cityNum,
      flow_color,
      onFlowColorChange
    }
  }
}
</script>

<style>
.config-title {
  font-weight: 600;
  text-align: left;
  margin-left: 10px;
  margin-bottom: 5px;
  margin-top: 12px;
}
.trend-filter {
  display: flex;
  justify-content: space-between;
  width: 240px;
  margin: 0 auto;
}
.span-filter {
  display: flex;
  justify-content: space-between;
  width: 240px;
  margin: 0 auto;
  padding: 0 2px;
}
.filter-region {
  border: solid 1px #cecece;
  border-radius: 5px;
  width: 248px;
  margin: 0 auto;
  margin-bottom: 8px;
  /* padding-top: 2px; */
}

.range-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
}

.slider-container {
  margin-left: 10px;
  margin-right: 10px;
}

#customRange1,
#customRange2 {
  width: 60%;
  margin: 0px;
}

.pointer-label.high {
  margin-left: 164px;
}

.color-sel-region {
  display: flex;
  justify-content: space-around;
  align-items: center;
  /* border: solid 1px #cecece;
  border-radius: 5px; */
  /* width: 248px;
  margin: 0 auto; */
}
</style>