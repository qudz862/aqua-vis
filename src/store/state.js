export default {
  mapPointsUpdate: 0,
  cityLocs: [],
  selectedLocs: [],
  selectedCities: "",
  selCityList: [],
  selCityIDList: [],
  selTime: {
    "start": "2015-01-05",
    "end": "2016-01-03"
  },
  airQualityInfor: {},
  valFlag: [1, 1, 1, 1, 1, 1],
  clusteringResult: [],
  clusterNum: 6,
  selClusterID: {'id': -1, 'level': -1},
  cityTemporalList: {},
  vmsp_pattern: [],
  flow_filters: ['up', 'down', 'stable'],
  span_filters: ['0', '1', '2', '3', '4', '5'],
  count_range: [],
  flow_importance_list: [],
  flow_color: 'Importance',
  focused_city: 'None',
  focused_level: -1
}
