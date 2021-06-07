import * as d3 from 'd3'

const cityGroup = {
    "jing-jin-ji": [],
    "chang-san-jiao": [],
    "fen-wei": [],
    "zhu-san-jiao": [],
    "cheng-yu": []
}

const aqiColorScheme_green = d3.scaleLinear()
    .domain([0, 50])
    .range(['#01e400', d3.interpolateRdYlGn(0.9)])
const aqiColorScheme_orange = d3.scaleLinear()
    .domain([50, 150])
    .range(['#fee493', '#ff7e00'])
const aqiColorScheme_red = d3.scaleLinear()
    .domain([150, 200])
    .range(['#f34b36', '#ba1419'])
const aqiColorScheme_purple = d3.scaleLinear()
    .domain([200, 300])
    .range(['#766ab0', '#4b1787'])
const aqiColorScheme_deepRed = d3.scaleLinear()
    .domain([300, 500])
    .range(['#880000', '#440000'])

const aqiColorScheme = [
    aqiColorScheme_green,
    aqiColorScheme_orange,
    aqiColorScheme_red,
    aqiColorScheme_purple,
    aqiColorScheme_deepRed
]

export {
    cityGroup,
    aqiColorScheme
}
  