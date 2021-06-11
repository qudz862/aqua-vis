<template>
  <div class="outer-container">
    <div class="title-layer">Control Panel</div>
    <SpaceConfig @selectRegion="selectRegion" />
    <TimeConfig />
    <SubspaceConfig />
    <!-- <FlowFilter /> -->
  </div>
</template>

<script>
import SpaceConfig from './SpaceConfig'
import TimeConfig from './TimeConfig'
import SubspaceConfig from './SubspaceConfig'
import FlowFilter from './FlowFilter'
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import getData from '@/services'

export default {
  name: 'ControlPanel',
  components: {
    SpaceConfig,
    TimeConfig,
    SubspaceConfig,
    FlowFilter
  },
  setup (props, context) {
    const store = useStore(),
          state = store.state
    const stateObj = computed(() => state).value

    const selectRegion = (region) => {
      // console.log(region);
      getData(store, 'select_cities', region)
      // console.log(stateObj.mapPointsUpdate);
    }

    return {
      selectRegion
    }
  }
}
</script>

<style scoped>
.outer-container {
  width: 310px;
  height: 1007px;
  border: solid 1px #c2c5c5;
  border-radius: 6px;
  /* padding: 1px; */
  margin: 3px;
}

.title-layer {
  /* position: absolute; */
  z-index: 80;
  width: 278px;
  height: 20px;
  text-align: left;
  padding-left: 12px;
  /* background-color: #6c757d; */
  /* color: #fff; */
  margin-top: 10px;
  /* font: 700 16px "Microsort Yahei"; */
  font: 700 20px "Arial";
  /* letter-spacing: 1px; */
  color: #333;
}
</style>