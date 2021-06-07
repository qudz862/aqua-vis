<template>
  <div class="whole-container">
    <div class="col1">
      <Control />
      <!-- <Subspace />   -->
    </div>
    <div>
      <div class="row-up">
        <Map />
        <CO3Plot />
        <STDistribution />    
      </div>
      <Evolution />
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Map from './Map'
import Control from './Control'
import Subspace from './Subspace'
import CO3Plot from './CO3Plot'
import STDistribution from './STDistribution'
import Evolution from './Evolution'
export default {
  name: 'Home',
  components: {
    Map,
    Control,
    Subspace,
    CO3Plot,
    STDistribution,
    Evolution
  }
}
</script>

<style scoped>
.whole-container {
  padding: 2px;
  /* border: solid 1px #666; */
  /* width: 1920px;
  height: 1080px; */
  display: flex;
}
.row-up {
  display: flex;
}
</style>
