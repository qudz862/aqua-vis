export default {
  setData (state, payload) {
    const { field, data } = payload
    switch (field) {
      case 'city_loc':
        if (state.cityLocs !== data) {
          state.cityLocs = data
          state.mapPointsUpdate += 1
        }
        break
      case 'select_loc':
        if (state.selectedLocs !== data) {
          state.selectedLocs = data
        }
        break
      case 'select_cities':
        if (state.selectedCities !== data) {
          state.selectedCities = data
          // console.log(data);
          state.mapPointsUpdate += 1
        }
        break
      case 'city_list':
        if (state.selCityList !== data) {
          state.selCityList = data
        }
        break
      case 'city_id_list':
        if (state.selCityIDList !== data) {
          state.selCityIDList = data
        }
        break
      case 'select_time':
        if (state.selTime !== data) {
          state.selTime = data
        }
        break
      case 'air_quality_infor':
        if (state.airQualityInfor !== data) {
          state.airQualityInfor = data
        }
        break
      case 'var_flag':
        if (state.valFlag !== data) {
          state.valFlag = data
        }
        break
      case 'clustering_result':
        if (state.clusteringResult !== data) {
          state.clusteringResult = data
        }
        break
      case 'cluster_num':
        if (state.clusterNum !== data) {
          state.clusterNum = data
        }
        break
      case 'sel_cluster_id':
        if (state.selClusterID !== data) {
          state.selClusterID = data
        }
        break
      case 'temporal_list':
        if (state.cityTemporalList !== data) {
          state.cityTemporalList = data
        }
        break
      case 'vmsp_pattern':
        if (state.vmsp_pattern !== data) {
          state.vmsp_pattern = data
        }
        break
      case 'flow_filters':
        if (state.flow_filters !== data) {
          state.flow_filters = data
        }
        break
      case 'span_filters':
        if (state.span_filters !== data) {
          state.span_filters = data
        }
        break
      case 'count_range':
        if (state.count_range !== data) {
          state.count_range = data
        }
        break
      case 'flow_importance_list':
        if (state.flow_importance_list !== data) {
          state.flow_importance_list = data
        }
        break
      case 'flow_color':
        if (state.flow_color !== data) {
          state.flow_color = data
        }
        break
      case 'focused_city':
        if (state.focused_city !== data) {
          state.focused_city = data
          state.mapPointsUpdate += 1
        }
        break
      case 'focused_level':
        if (state.focused_level !== data) {
          state.focused_level = data
          // state.mapPointsUpdate += 1
        }
        else state.focused_level = -1
        break
      default:
        break
    }
  }
}