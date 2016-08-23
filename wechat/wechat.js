`use strict`

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

var prefix = "https://api.weixin.qq.com/cgi-bin";
var api = {
  accessToken : prefix + "/token?grant_type=client_credential"
}

function Wechat(opts) {
  var that = this;
  this.appID = opts.appID;
  this.appSecret = opts.appSecret;
  this.getAccessToken = opts.getAccessToken;
  this.saveAccessToken = opts.saveAccessToken;

  this.getAccessToken()
    .then (function(data) {
      try {
        data = JSON.parse(data);

        console.log("data1" + JSON.stringify(data));
      } catch (e) {
        return that.updateAccessToken();
      }

      if (that.isValidAccessToken(data)) {
        return Promise.resolve(data);
      } else {
        return that.updateAccessToken();
      }
    })
    .then (function(data) {
      that.access_token = data.access_token;
      that.expires_in = data.expires_in;

      that.saveAccessToken(data);
    })
}

// 在原型链上增加方法
Wechat.prototype.isValidAccessToken = function(data) {
  if (!data || !data.access_token || !data.expires_in) {
    return false;
  }

  var access_token = data.access_token;
  var expires_in = data.expires_in;
  var now = (new Date().getTime());

  if (now < expires_in) {
    return true;
  } else {
    return false;
  }
}

Wechat.prototype.updateAccessToken = function() {
  var appID = this.appID;  //
  var appSecret = this.appSecret;
  var url = api.accessToken + "&appid=" + appID +"&secret=" + appSecret;
  console.log("url" + url);

  return new Promise(function(resolve, reject) {
    //向服务器发送请求
    // 此处的url不能大写
    request({url : url, json : true}).then(function(response) {
      var data = response.body;

      var now = new Date().getTime();
      var expires_in = now + (data.expires_in - 20) * 1000;

      data.expires_in = expires_in;
      resolve(data);
    });
  });
}

module.exports = Wechat;
