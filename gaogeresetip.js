// 导入所需的依赖库
const cheerio = require('cheerio');//用于解析html
const axios = require('axios');//用于发送http请求
const querystring = require('querystring');//用于解析和格式化url查询字符串

// 定义一个异步函数 getCSRFTokenAndTimestamp，传入一个 URL 参数
async function getCSRFTokenAndTimestamp(url) {
    try {
    // 使用 axios 向传入的 URL 发送 GET 请求
      const response = await axios.get(url);
      const html = response.data;
    //   console.log(html);
    // 使用正则表达式从 HTML 中匹配 CSRF 令牌和时间戳
      const csrfTokenMatch = html.match(/gocloud\.sysauth\.csrftoken\s*=\s*["']([^"']+)["']/);
      const timestampMatch = html.match(/gocloud\.sysauth\.timestamp\s*=\s*["']([^"']+)["']/);
   // 如果找到了 CSRF 令牌和时间戳，返回它们的值
      if (csrfTokenMatch && timestampMatch) {
        return {
          csrfToken: csrfTokenMatch[1],
          timestamp: timestampMatch[1],
        };
      } else {
   // 如果没有找到，输出提示并返回 null
        console.log('未找到 CSRF 令牌或时间戳。');
        return null;
      }
    } catch (error) {
   // 如果请求失败，输出错误信息并返回 null
      console.log('请求失败:', error);
      return null;
    }
  }
  // 定义一个异步函数 loginAndGetCookie，传入 url、csrfToken 和 timestamp 参数
async function loginAndGetCookie(url, csrfToken, timestamp) {
  // 使用 querystring 库将登录所需的参数序列化为字符串格式
    const data = querystring.stringify({
      userName: 'admin',
      password: 'changeme',  // 填入你自己的账户密码
      timestamp: timestamp,
      csrftoken: csrfToken,
      newwebui: 'yes',
      username: 'admin',
      type: 'account',
    });
    // 配置 axios 请求
    const config = {
      method: 'post',  // 使用 POST 方法
      url: url, // 请求 URL
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // 设置 Content-Type 为表单提交类型
      },
      data: data,  // 设置请求体为序列化后的登录参数
    };
  
    try {
      // 使用 axios 发送请求
      const response = await axios(config);
      // 如果响应状态码为 200 并且响应数据的 status 字段为 success，说明登录成功
      if (response.status === 200 && response.data.status === 'success') {
        // 获取响应头中的 Set-Cookie 字段，即为登录后的 Cookie
        const cookie = response.headers['set-cookie'];
        return cookie;
      } else {
        console.log('登录失败');
        return null;
      }
    } catch (error) {
      console.log('请求失败:', error);
      return null;
    }
  }
  //定义一个函数，用于发送重拨请求
  async function sendReconnectRequest(url, cookie) {
    const config = {
      method: 'get',
      url: url,
      headers: {
        Cookie: cookie,
      },
    };
  
    try {
      const response = await axios(config);
      if (response.status === 200) {
        console.log('重拨成功');
      } else {
        console.log('重拨失败');
      }
    } catch (error) {
      console.log('请求失败:', error);
    }
  }
  // 创建一个立即执行的异步函数表达式
  (async () => {
    //定义需要使用的 URL
    const csrfUrl = 'http://192.168.3.1/cgi-bin/webui/admin';
    const loginUrl = 'http://192.168.3.1/cgi-bin/webui/admin';
    const reconnectUrl = 'http://192.168.3.1/cgi-bin/webui/admin/network/iface_reconnect/wan3';
  // 调用 getCSRFTokenAndTimestamp 函数获取 CSRF 令牌和时间戳
    const { csrfToken, timestamp } = await getCSRFTokenAndTimestamp(csrfUrl);
    if (csrfToken && timestamp) {
      // 如果成功获取到 CSRF 令牌和时间戳，调用 loginAndGetCookie 函数进行登录并获取 Cookie
      const cookie = await loginAndGetCookie(loginUrl, csrfToken, timestamp);
      if (cookie) {
      // 如果成功获取到 Cookie，调用 sendReconnectRequest 函数发送重拨请求
        await sendReconnectRequest(reconnectUrl, cookie);
      }
    }
  })(); // 立即执行这个异步函数表达式
  
  // 参考资料
  // 异步函数（async function）和 await 关键字：Async function - JavaScript | MDN
  // 立即执行函数表达式（IIFE）：Immediately-invoked Function Expressions (IIFE) - JavaScript | MDN
  // axios 库：Axios - npm
  // cheerio 库：Cheerio - npm
  // 正则表达式（RegExp）：RegExp - JavaScript | MDN