<template>
  <div class="config-title">
    <span class="iconfont">&#xe663;</span> Space Selection
  </div>
  <div class="btn-group-vertical">
    <button type="button" class="btn btn-light" @click="selRegion('jing-jin-ji')">Jing-Jin-Ji Region <span class="badge badge-secondary">31</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('chang-san-jiao')">Chang-San-Jiao Region <span class="badge badge-secondary">41</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('fen-wei')">Fen-Wei Plain Region <span class="badge badge-secondary">11</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('zhu-san-jiao')">Zhu-San-Jiao Region <span class="badge badge-secondary">15</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('cheng-yu')">Cheng-Yu Region <span class="badge badge-secondary">16</span></button>
  </div>
  <div class="form-group">
    <textarea class="form-control" id="Textarea1" rows="2" readonly>Selected Cities: </textarea>
  </div>
  <div class="sel-focus-city">
    <div class="sub-label">Focused city</div>
    <!-- <select class="form-control" id="focus_city_select">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select> -->
    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{ cur_focus_city }}
    </button>
    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
      <a class="dropdown-item" @click="onItemClick($event)">None</a>
      <a v-for="item in selCityList" class="dropdown-item" @click="onItemClick($event)"> {{item}} </a>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SpaceConfig',
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    const selRegion = (region) => {
      context.emit('selectRegion', region)
    }

    let selCityList = ref([])
    let selLocList
    let cur_focus_city = ref('None')
    store.commit('setData', {
      field: 'focused_city',
      data: cur_focus_city.value
    })

    onMounted(() => {
      
    })

    const onItemClick = (e) => {
      // console.log(e.target.innerText);
      cur_focus_city.value = e.target.innerText
      store.commit('setData', {
          field: 'focused_city',
          data: cur_focus_city.value
        })
    }

    watch (() => stateObj.focused_city, (oldVlaue, newValue) => {
      cur_focus_city.value = stateObj.focused_city
    })

    watch (() => stateObj.selCityIDList, (oldVlaue, newValue) => {
      // console.log(stateObj.selCityIDList);
      selCityList.value = []
      selLocList = []
      for (let i = 0; i < stateObj.selCityIDList.length; ++i) {
        selCityList.value.push(stateObj.cityLocs[stateObj.selCityIDList[i]].properties.title)
        selLocList.push(stateObj.cityLocs[stateObj.selCityIDList[i]].geometry.coordinates)
      }

      store.commit('setData', {
        field: 'city_list',
        data: selCityList.value
      })
      store.commit('setData', {
        field: 'select_loc',
        data: selLocList
      })

      document.getElementById('Textarea1').innerHTML = "Selected Cities: " + selCityList.value.toString()

      // $('.dropdown-item').click((e) => {
      //   console.log(e.target.text);
      //   $('#dropdownMenuButton').text(e.target.text)
      //   // console.log('aaa');
      //   store.commit('setData', {
      //     field: 'focused_city',
      //     data: e.target.text
      //   })
      // })
    })

    return {
      selRegion,
      selCityList,
      onItemClick,
      cur_focus_city
    }
  }
}
</script>

<style scoped>
.btn-light {
  width: 240px !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  background-color: #eff0f0;
  font-size: 14px !important;
}

.badge-secondary {
  font-size: 12px !important;
}

.config-title {
  font-weight: 600;
  text-align: left;
  margin-left: 10px;
  margin-bottom: 3px;
  margin-top: 5px;
}
#Textarea1 {
  width: 240px !important;
  text-align: left !important;
  padding: 1px;
  margin: 0 auto;
  margin-top: 5px;
  font-size: 12px;
}

.sel-focus-city {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 240px;
  margin: 0 auto;
  margin-top: -10px;
  margin-bottom: 7px;
}

.sub-label {
  font-size: 14px;
}

#focus_city_select {
  width: 160px !important;
  height: 28px;
  font-size: 14px;
  padding-bottom: 0px;
  padding-top: 0px;
  margin-top: -10px;
}

#dropdownMenuButton {
  width: 140px;
  height: 28px;
  font-size: 14px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: space-between;
  background-color: #6c757d;
}

.dropdown-menu {
  width: 140px;
}

.dropdown-item {
  padding: 2px 12px !important;
  height: 18px;
  font-size: 12px;
}
</style>