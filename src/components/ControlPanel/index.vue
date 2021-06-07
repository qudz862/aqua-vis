<template>
  <div class="outer-container">
    <div class="title-layer">Control Panel</div>
    <SpaceConfig @selectRegion="selectRegion" />
    <TimeConfig />
    <SubspaceConfig />
    <FlowFilter />
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
  width: 270px;
  height: 1073px;
  border: solid 1px #b2b5b5;
  /* padding: 1px; */
  margin: 1px;
}

.title-layer {
  /* position: absolute; */
  z-index: 80;
  width: 268px;
  height: 24px;
  text-align: left;
  padding-left: 12px;
  background-color: #6c757d;
  color: #fff;
}
</style>