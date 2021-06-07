<template>
  <div class="config-title">
    <span class="iconfont">&#xe706;</span> Time Selection
  </div>
  <div class="form-group">
    <div class="form-row">
      <div>Start: </div> 
      <input type="date" name="startTime" id="startTime" class="form-control" 
      max="2016-01-03" min="2015-01-05" 
      v-model="startTime" @change="onStartTimeChange()">
    </div>
    <div class="form-row">
      <div>End: </div> 
      <input type="date" name="endTime" id="endTime" class="form-control" 
      max="2016-01-03" min="2015-01-05" 
      v-model="endTime" @change="onEndTimeChange()">
    </div>
  </div>
  <div>
    <button id="get-data-btn" type="button" class="btn btn-secondary" @click="getAirQualityInfor()">
      <!-- <span class="iconfont">&#xe603;</span> -->
      Get Air Quality Data
    </button>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import getData from '@/services'

export default {
  name: 'TimeConfig',
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    const startTime = ref("2015-01-05")
    const endTime = ref("2016-01-03")

    const onStartTimeChange = () => {
      store.commit('setData', {
        field: 'select_time',
        data: {
          "start": startTime.value,
          "end": endTime.value
        }
      })
      // console.log(stateObj.selTime);
    }
    
    const onEndTimeChange = () => {
      store.commit('setData', {
        field: 'select_time',
        data: {
          "start": startTime.value,
          "end": endTime.value
        }
      })
      // console.log(stateObj.selTime);
    }

    const getAirQualityInfor = () => {
      if (stateObj.cityLocs === []) {
        alert('Please select cities.')
        return 
      }

      getData(store, 'air_quality_infor', JSON.stringify(stateObj.selCityList), JSON.stringify(stateObj.selTime))
    }

    return {
      startTime,
      endTime,
      onStartTimeChange,
      onEndTimeChange,
      getAirQualityInfor
    }
  }
}
</script>

<style scoped>
.config-title {
  font-weight: 600;
  text-align: left;
  margin-left: 10px;
  margin-bottom: 5px;
}

.form-row {
  width: 240px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 5px;
}

.form-control {
  width: 194px;
  font-size: 14px;
  padding: 0 5px;
  height: 28px;
}

#get-data-btn {
  width: 240px;
  height: 32px;
  padding: 2px 0px;
  margin-top: -7px;
}

</style>