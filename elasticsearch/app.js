

var http = require('http');
var sys  = require('sys');

function elivated(headers,callback) {
	if(headers['x-secrt']){
		try {
			user=JSON.parse(headers['x-secrt']).user;
			pass=JSON.parse(headers['x-secrt']).pass;
		} catch (e) {
    		callback(false);
  		}
		//console.log("http://LM-MAA-26500421.paypalcorp.com:9200/sahayak/login/_search?q=user:"+user+" pass:"+pass);

		http.get("http://LM-MAA-26500421.paypalcorp.com:9200/sahayak/login/_search?q=user:"+user+" pass:"+pass, function(res) {
    		
    		res.on('data', function (chunk) {
    			//console.log('BODY: ' + chunk);
    			var obj = JSON.parse(chunk);
  				if(obj.hits.hits && obj.hits.hits.length > 0){
    				callback(true);
    			} else {
    				callback(false);
    			}

  			});
		});
	} else {
		callback(false);
	}
}

function allowed(ip,url,method) {
	if(url.indexOf("login") > -1) {
		return false;
	}
	
	if(method=='DELETE' || method=='PUT'){
		return false;
	}
	if(method=='POST'){
		if(url.indexOf("/_search") > -1){
			return true;
		}
		if(url.indexOf("temp_ngodetails") > -1) {
			return true;
		}
		return false;
	}
	return true;
}

function deny(response, msg) {
	response.writeHead(401);
	response.write(msg);
	response.end();
}

http.createServer(function(request, response) {
	var ip = request.connection.remoteAddress;
	var url = request.url;
	console.log();
	var method = request.method

	elivated(request.headers,function(auth){
		
		//console.log(auth)

		if(!auth && !allowed(ip,url,method)) {
			msg = "Host " + request.url + " has been denied";
			deny(response, msg);
			sys.log(msg);
			return;
		} else {
			sys.log(ip + ": " + request.method + " " + request.url);
  				//var proxy = http.createClient(80, request.headers['host'])
  				var proxy = http.createClient(9200, "LM-MAA-26500421.paypalcorp.com")
  				var proxy_request = proxy.request(request.method, request.url, request.headers);
  				proxy_request.addListener('response', function(proxy_response) {
  					proxy_response.addListener('data', function(chunk) {
  						response.write(chunk, 'binary');
  					});
  					proxy_response.addListener('end', function() {
  						response.end();
  					});
  					response.writeHead(proxy_response.statusCode, proxy_response.headers);
  				});
  				request.addListener('data', function(chunk) {
  					proxy_request.write(chunk, 'binary');
  				});
  				request.addListener('end', function() {
  					proxy_request.end();
  				});
  			}
  		}) 
}).listen(8080);

