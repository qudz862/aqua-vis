<template>
  <div class="config-title">
    <!-- <span class="iconfont">&#xe663;</span> Space Selection -->
    <span class="iconfont">&#xe663;</span> SPACE SELECTION
  </div>

  <div class="ua-dropdown"> 
    <button class="btn dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{ selUrbanAgglomeration }}</button>
    <div id="dropdown-menu-ua" class="dropdown-menu" aria-labelledby="dropdownMenuButton">
      <button type="button" class="btn btn-light" @click="selRegion('jing-jin-ji')">Jing-Jin-Ji Region <span class="badge badge-secondary">31</span></button>
      <button type="button" class="btn btn-light" @click="selRegion('chang-san-jiao')">Chang-San-Jiao Region <span class="badge badge-secondary">41</span></button>
      <button type="button" class="btn btn-light" @click="selRegion('fen-wei')">Fen-Wei Plain Region <span class="badge badge-secondary">11</span></button>
      <button type="button" class="btn btn-light" @click="selRegion('zhu-san-jiao')">Zhu-San-Jiao Region <span class="badge badge-secondary">15</span></button>
      <button type="button" class="btn btn-light" @click="selRegion('cheng-yu')">Cheng-Yu Region <span class="badge badge-secondary">16</span></button>
    </div>
  </div>
  <MapLayer />
  <!-- <div class="btn-group-vertical">
    <button type="button" class="btn btn-light" @click="selRegion('jing-jin-ji')">Jing-Jin-Ji Region <span class="badge badge-secondary">31</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('chang-san-jiao')">Chang-San-Jiao Region <span class="badge badge-secondary">41</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('fen-wei')">Fen-Wei Plain Region <span class="badge badge-secondary">11</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('zhu-san-jiao')">Zhu-San-Jiao Region <span class="badge badge-secondary">15</span></button>
    <button type="button" class="btn btn-light" @click="selRegion('cheng-yu')">Cheng-Yu Region <span class="badge badge-secondary">16</span></button>
  </div> -->
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
    <button class="btn dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
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
import MapLayer from './MapLayer'

export default {
  name: 'SpaceConfig',
  components: {
    MapLayer
  },
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    const selRegion = (region) => {
      switch (region) {
        case 'jing-jin-ji':
          selUrbanAgglomeration.value = "Jing-Jin-Ji Region"
          break
        case 'chang-san-jiao':
          selUrbanAgglomeration.value = "Chang-San-Jiao Region"
          break
        case 'fen-wei':
          selUrbanAgglomeration.value = "Fen-Wei Plain Region"
          break
        case 'zhu-san-jiao':
          selUrbanAgglomeration.value = "Zhu-San-Jiao Region"
          break
        case 'cheng-yu':
          selUrbanAgglomeration.value = "Cheng-Yu Region"
          break
        default:
          break
      }
      
      context.emit('selectRegion', region)
    }

    let selCityList = ref([])
    let selUrbanAgglomeration = ref("Select urban agglomeration")
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
      console.log(cur_focus_city.value);
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
      cur_focus_city,
      selUrbanAgglomeration
    }
  }
}
</script>

<style scoped>


.badge-secondary {
  font-size: 12px !important;
}

.config-title {
  /* font-weight: 600; */
  font-weight: 400;
  text-align: left;
  margin-left: 10px;
  margin-bottom: 3px;
  margin-top: 10px;
  letter-spacing: 0.5px;
  font-family: "Arial";
}

#Textarea1 {
  width: 280px !important;
  text-align: left !important;
  padding: 1px;
  margin: 0 auto;
  margin-top: 8px;
  font-size: 13px;
}

.sel-focus-city {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 280px;
  margin: 0 auto;
  margin-top: -10px;
  margin-bottom: 7px;
}

.sel-focus-city .dropdown-toggle {
  border-bottom: solid 1px #9c9c9c;
  border-radius: 0;
}

.sub-label {
  font-size: 15px;
}

#focus_city_select {
  width: 160px !important;
  height: 26px;
  font-size: 14px;
  padding-bottom: 0px;
  padding-top: 0px;
  margin-top: -10px;
}

#dropdownMenuButton {
  width: 160px;
  height: 28px;
  font-size: 14px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: space-between;
  /* background-color: #6c757d; */
}

.dropdown-menu {
  width: 140px;
}

.dropdown-item {
  padding: 2px 12px !important;
  height: 18px;
  font-size: 12px;
}

.ua-dropdown,
.ua-dropdown .dropdown-toggle,
#dropdown-menu-ua {
  margin: 0 auto;
  width: 280px !important;
}

.ua-dropdown .dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  font-size: 15px;
  border-bottom: solid 1px #9c9c9c;
  border-radius: 0;
}

.btn-light {
  width: 278px !important;
  /* margin-right: 12px; */
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  /* background-color: #eff0f0; */
  font-size: 14px !important;
  border: solid 1px #fff !important;
  /* border: none; */
}

</style>