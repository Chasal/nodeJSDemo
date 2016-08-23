`use strict`

var sha1 = require('sha1');
var Wechat = require('./wechat');
var getRawBody = require('raw-body');
var util = require('./util');

module.exports = function(opts) {
  //var wechat = new Wechat(opts);

  return function *(next) {
    console.log(this.query);
    //var that = this;

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
    // koa框架，中的method方法
    if (this.method === "GET") {
      if (sha === signature) {
        this.body = echostr + '';
      } else {
        this.body = 'Wrong';
      }
    } else if (this.method === "POST") {
      if (sha != signature) {
        this.body = 'Wrong';
        return false;
      }

      var data = yield getRawBody(this.req, {
        length : this.length,
        limit : '1mb',
        encoding : this.charset
      });

      var content = yield util.parseXMLAsync(data);
      console.log(content);

      var message = util.formatMessage(content.xml);
      console.log(message);

      if (message.MsgType === "event") {
        if (message.Event === "subscribe") {

          var now = new Date().getTime();

          this.status = 200;
          this.type = "application/xml";
          var replay = "<xml>"+
                        "<ToUserName><![CDATA["+ message.FromUserName +"]]></ToUserName>"+
                        "<FromUserName><![CDATA["+ message.ToUserName +"]]></FromUserName>"+
                        "<CreateTime>"+ now +"</CreateTime>"+
                        "<MsgType><![CDATA[text]]></MsgType>"+
                        "<Content><![CDATA[Hello World!]]></Content>"+
                      "</xml>";

          console.log(replay);
          this.body = replay;
          return;
        }
      }
    }
  }
}
