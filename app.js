`use strict`

var Koa = require('koa');
var wechat = require('./wechat/g');
var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt')

var config = {
  wechat : {
    appID : 'wx0fb6af95d4c1d634',
    appSecret : 'e398c0904fb0c96265c3e37514cbc220',
    token : 'thomasli',
    getAccessToken : function() {
      return util.readFileAsync(wechat_file, 'UTF-8');
    },
    saveAccessToken : function(data) {
      data = JSON.stringify(data);
      return util.writeFileAsync(wechat_file, data);
    }
  }
}

var app = new Koa();

app.use(wechat(config.wechat));
app.listen(8080);

console.log('Listening: 8080');
