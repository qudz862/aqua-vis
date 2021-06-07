import {
  getCityLocs,
  getAirQualityInfor,
  getClusteringResult,
  getVMSPResults,
  getFlowImportance
} from './request'

import { cityGroup } from '@/data'

import { strToJson } from '@/libs/utils'


export default async (store, field, ...args) => {
  let data = null
  switch (field) {
    case 'city_loc':
      data = await getCityLocs(...args)
      break
    case 'air_quality_infor':
      data = await getAirQualityInfor(...args)
      break
    case 'clustering_result':
      data = await getClusteringResult(...args)
      break
    case 'vmsp_pattern':
      data = await getVMSPResults(...args)
      break
    case 'flow_importance_list':
      data = await getFlowImportance(...args)
      break
    default:
      break
  }

  // console.log(typeof data);

  let res = null

  switch (field) {
    case 'city_loc':
      let jsonData = strToJson(data)
      // 构建为geojson的feature格式
      res = []
      jsonData.forEach((item,index,array)=>{
        let feature = {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [item['lng'], item['lat']]
          },
          "properties": {
            "title": item['name'],
            "group": item['group'],
            "index": item['index']
          }
        }
        // if (item['group'] == "jing-jin-ji") cityGroup["jing-jin-ji"].push(item['name'])
        // if (item['group'] == "chang-san-jiao") cityGroup["chang-san-jiao"].push(item['name'])
        // if (item['group'] == "fen-wei") cityGroup["fen-wei"].push(item['name'])
        // if (item['group'] == "zhu-san-jiao") cityGroup["zhu-san-jiao"].push(item['name'])
        // if (item['group'] == "cheng-yu") cityGroup["cheng-yu"].push(item['name'])
        
        if (item['group'] == "jing-jin-ji") cityGroup["jing-jin-ji"].push(item['index'])
        if (item['group'] == "chang-san-jiao") cityGroup["chang-san-jiao"].push(item['index'])
        if (item['group'] == "fen-wei") cityGroup["fen-wei"].push(item['index'])
        if (item['group'] == "zhu-san-jiao") cityGroup["zhu-san-jiao"].push(item['index'])
        if (item['group'] == "cheng-yu") cityGroup["cheng-yu"].push(item['index'])

        res.push(feature)
      })
      break
    case 'select_cities':
      // console.log(...args);
      let region = args[0]
      // console.log(region);
      res = region
      break
    case 'air_quality_infor':
      res = data
      break
    case 'clustering_result':
      res = data
      break
    case 'vmsp_pattern':
      res = data
      break
    case 'flow_importance_list':
      res = data
      break
    default:
      break
  }

  // console.log(typeof res);

  store.commit('setData', {
    field,
    data: res
  })

  return 0
}