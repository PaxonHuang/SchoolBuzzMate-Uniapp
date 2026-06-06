// UniCloud 配置中心
module.exports = function (id) {
  const config = require(`./${id}/config.json`)
  return config
}