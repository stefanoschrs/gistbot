const https = require('https');
const fs = require('fs');

const date = `${(new Date()).getDate()}-${(new Date()).getMonth()}-${(new Date()).getFullYear()}`;

var config;
try{
	config = require('./config');
}
catch(e){
	config = {
		clientId: 'xxx',
		clientSecret: 'yyy'
	};
}

/** .gistbotrc variables */
var loglevel, interval, lineWidth, languages, regularExpressions, storageType;
var cache = [];
var options = {
	hostname: 'api.github.com',
	port: 443,
	path: `/gists/public?client_id=${config.clientId}&client_secret=${config.clientSecret}`,
	method: 'GET',
	headers: {
		'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36',
		'Accept': 'application/json'
	}
};

function digForRegex(files){
	var foundMatch = function(file, regex, data){
		var filename = regex.replace('https://gist.githubusercontent.com/', '').replace(/\W/g, '');
		fs.stat(`data/${filename}`, function(err, stats){
			if(err){
				fs.mkdirSync(`data/${filename}`);
				fs.stat(`data/${filename}/${file.replace(/\//g, '+')}`, function(err, stats){
					if(err){
						fs.writeFileSync(`data/${filename}/${file.replace(/\//g, '+')}`, data, 'utf8');
					}
				});
			}
			else{
				fs.stat(`data/${filename}/${file.replace(/\//g, '+')}`, function(err, stats){
					if(err){
						fs.writeFileSync(`data/${filename}/${file.replace(/\//g, '+')}`, data, 'utf8');
					}
				});
			}
		});
	};
	files.forEach((file)=>{
		var req = https.get(file, (res) => {
			var data = '';
			res.on('data', (d) => {
				data+=d;
			});
			res.on('end', () => {
				for (var i = 0; i < regularExpressions.length; i++) {
					if(data.match(new RegExp(regularExpressions[i], 'i'))){
						foundMatch(file, regularExpressions[i], data);
					}
				}
			});
		});
		req.end();
		req.on('error', (e) => {
			console.error(`Error fetching gist ${file}. ${e}`);
		});
	});
}

function isGistNew(gist, done){
	if(storageType === 'filesystem'){
		fs.readFile(`data/gistbot-${date}.tsv`, 'utf8', function(err, res){
			if(err || res.indexOf(gist.id) === -1){
				fs.appendFileSync(`data/gistbot-${date}.tsv`, `${gist.id}\t${gist.owner ? gist.owner.login : 'anonymous'}\t${gist.description}\n`);
				return done(1);
			}

			return done(0);
		});
	}
	else{
		if(cache.indexOf(gist.id) === -1){
			cache.push(gist.id);
			return done(1);
		}
		
		return done(0);
	}
}

function fetchData () {
	var req = https.request(options, (res) => {
		var data = '';
		res.on('data', (d) => {
			data+=d;
		});
		res.on('end', () => {
			data = JSON.parse(data);
			if(data.message) return;

			var filtered = data.filter((el)=>{
				if(!languages.length) return true;
				
				var flag = false;
				Object.keys(el.files).forEach((file)=>{
					if(languages.indexOf(el.files[file].language) !== -1){
						flag = true;
					}
				});
				return flag;
			});
			filtered.forEach((gist)=>{
				isGistNew(gist, (itsNew)=>{
					if(!itsNew) return;

					gist.description = (gist.description || 'No Description Available').replace(/\n/g, ' ');
					if(gist.description.length > lineWidth){
						gist.description = gist.description.slice(0, lineWidth);
						loglevel && console.log(`${gist.description} (${gist.html_url})`);
					}
					else{
						loglevel && console.log(`${gist.description}${' '.repeat(lineWidth - gist.description.length)} (${gist.html_url})`);
					}

					if(regularExpressions.length){
						digForRegex(Object.keys(gist.files).map((el)=>{
							return gist.files[el].raw_url;
						}));
					}
				});
			});
		});
	});
	req.end();

	req.on('error', (e) => {
		console.error(e);
	});
}

function version(){
	fs.readFile('./package.json', 'utf8', (err, res)=>{
		console.log(JSON.parse(res).version);
		process.exit();
	});
}

function main(){
	fs.readFile('.gistbotrc', 'utf8', function(err, res){
		if(err){
			console.log('Error: Can\'t find .gistbotrc file..');
			process.exit();
		}
		var rc = JSON.parse(res); // Temporary solution until es6 array desctructing comes
		loglevel = rc.loglevel;
		interval = rc.interval;
		lineWidth = rc.lineWidth;
		languages = rc.languages;		
		storageType = rc.storageType;
		if(rc.regexPath){
			try{
				regularExpressions = fs.readFileSync(rc.regexPath, 'utf8');
				regularExpressions = regularExpressions.split('\n');
			}
			catch(e){
				console.log('Error: Can\'t open file');
				process.exit();
			}
		}
		else{
			regularExpressions = [];
		}

		process.argv.shift();
		process.argv.shift();
		if(process.argv.indexOf('-v') !== -1) return version();

		fetchData();
		setInterval(fetchData, interval);		
	});
}

main();