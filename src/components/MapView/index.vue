<template>
  <MapLayer />
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import getData from '@/services'
import MapLayer from './MapLayer'

export default {
  name: 'MapView',
  components: {
    MapLayer
  },
  setup(props, context) {
    // const store = useStore(),
    //       state = store.state

    // getData(store, 'city_loc')

    // const stateObj = computed(() => state).value
    // console.log(stateObj);
    // watch (() => state.mapPointsUpdate, (oldVlaue, newValue) => {
    //   console.log(state.mapPointsUpdate);
    // })

    return {
      // stateObj
    }
  }
}
</script>

<style scoped>

</style>