`use strict`

var sha1 = require('sha1');
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

module.exports = function(opts) {
  var wechat = new Wechat(opts);

  return function *(next) {
    console.log(this.query);

    // 1. 从URL获取参数
    var token = opts.token;
    var signature = this.query.signature;
    var timestamp = this.query.timestamp;
    var nonce = this.query.nonce;
    var echostr = this.query.echostr;

    // 2. 将token、timestamp、nonce三个参数进行字典序排序
    var str = [token, timestamp, nonce].sort().join('');

    // 3. 将三个参数字符串拼接成一个字符串进行sha1加密
    var sha = sha1(str);

    // 4. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    if (sha === signature) {
      this.body = echostr + '';
    } else {
      this.body = 'Wrong';
    }
  }
}
