<template>
  <div class="sys-top-region">
    <div>T_T AQUA-VIS</div>
    <div>Visual Analytics System for Air Quality Spatio-Temporal Patterns in Ubran Agglomeration</div>
  </div>
  <div class="whole-container">
    <div class="col1">
      <Control />
      <!-- <Subspace />   -->
    </div>
    <div>
      <div class="row-up">
        <!-- <Map /> -->
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
.sys-top-region {
  width: 100%;
  height: 46px;
  background-color: #2c2c2c;
  /* margin: 1px; */
  margin-bottom: 5px;
  color: #fff;
  font: 700 24px "Arial";
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  /* border-radius: 10px; */
}

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
