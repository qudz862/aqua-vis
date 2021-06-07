import { axiosGet, axiosPost } from '@/libs/http'

function getCityLocs() {
  return new Promise((resolve, reject) => {
    axiosGet({
      url: 'http://219.217.34.41:1002/city_locs',
      success (data) {
        resolve(data)
      },
      error (err) {
        reject(err)
      }
    })
  })
}

function getAirQualityInfor(space, time) {
  return new Promise((resolve, reject) => {
    axiosGet({
      url: `http://219.217.34.41:1002/air_quality_infor/${space}/${time}`,
      success (data) {
        resolve(data)
      },
      error (err) {
        reject(err)
      }
    })
  })
}

function getClusteringResult(varFlag, clusterNum) {
  return new Promise((resolve, reject) => {
    axiosGet({
      url: `http://219.217.34.41:1002/clustering_result/${varFlag}/${clusterNum}`,
      success (data) {
        resolve(data)
      },
      error (err) {
        reject(err)
      }
    })
  })
}

function getVMSPResults(temporal_list, clusterNum) {
  return new Promise((resolve, reject) => {
    axiosGet({
      url: `http://219.217.34.41:1002/vmsp_pattern/${temporal_list}/${clusterNum}`,
      success (data) {
        resolve(data)
      },
      error (err) {
        reject(err)
      }
    })
  })
}

function getFlowImportance(flow_list, stack_list, city_num, cluster_num) {
  return new Promise((resolve, reject) => {
    axiosGet({
      url: `http://219.217.34.41:1002/flow_importance/${flow_list}/${stack_list}/${city_num}/${cluster_num}`,
      success (data) {
        resolve(data)
      },
      error (err) {
        reject(err)
      }
    })
  })
}

export {
  getCityLocs,
  getAirQualityInfor,
  getClusteringResult,
  getVMSPResults,
  getFlowImportance
}