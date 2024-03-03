// @ts-ignore
import { connect } from 'cloudflare:sockets';
let sub = ['cm.git.cloudns.biz'];
const hostName = 'test.xyz';
const userID = '90cd4a77-141a-43c9-991b-08263cfe9c10';
let ip = [];

function extractInfo(encodedUrls) {
  const lines = encodedUrls.split('\n');
  //console.log("lins content:", lines);
  const extractedData = [];
  let nameTemp = [];
  for (const line of lines) {
    const match = line.match(/@([\d.]+):(\d+)\?/);
    if (match) {
      const ipAddress = match[1];
      const port = match[2];
      const hashIndex = line.indexOf('#');
      const name = hashIndex !== -1 ? line.slice(hashIndex + 1) : '';
      //包含中文字符(一般有广告)跳过
      if (/[\u4e00-\u9fa5]/.test(name)){
        continue;
      }
      //去掉ip重复
      const ipcount = ip.reduce((total, item) => (item === ipAddress ? total + 1 : total), 0);
      if (ipcount > 0){
        continue;
      }
      //名字重复的取前2个
      const count = nameTemp.reduce((total, item) => (item === name ? total + 1 : total), 0);
      if (count == 0) {
        extractedData.push(`${ipAddress}:${port}#${name}`);
        nameTemp.push(name);
        ip.push(ipAddress);
      }else if(count < 2){
        extractedData.push(`${ipAddress}:${port}#${name}-${count}`);
        nameTemp.push(name);
        ip.push(ipAddress);
      }
      //总数不超过15个(自取前15个)
      if(nameTemp.length >= 15){
        return extractedData;
      }
      
    }
  }
  //console.log("extractedData content:", extractedData);
  return extractedData;
};

export default {
	async fetch(request, env, ctx) {
    const url = new URL(request.url);
    sub = env.SUB ? env.SUB.split(",") : sub;
    sub = url.searchParams.get('sub') ? url.searchParams.get('sub').split(",") : sub;
    
    let addressapi = [];
    ip = [];

		try {
      for (const subs of sub) {
        //console.log("subs content:", subs);
        const response = await fetch(`https://${subs}/sub?host=${hostName}&uuid=${userID}&path=?ed2048&edgetunnel=cmliu`);
        if (!response.ok) {
          continue;
        }
        const content = await response.text();

        if (!content.length || content.length % 4 !== 0 || /[^A-Z0-9+\/=]/i.test(content)) {
          continue;
        }
        //console.log("content:", content);
        const decodedContent = decodeURI(atob(content)); // Base64 decoding
        //console.log("Decoded content:", decodedContent);
        const newaddressapi = extractInfo(decodedContent);
        addressapi = addressapi.concat(newaddressapi);
      }
      if (addressapi.length >= 0){
        const Raddressapi = addressapi.join("\n");
        return new Response(Raddressapi, {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
      
		} catch (err) {
			/** @type {Error} */ let e = err;
			return new Response(e.toString());
		}
	},
};
