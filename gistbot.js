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
var languages = '';
var interval = 30000;
var lineWidth = 80;
var filesystem = 0;
var regularExpressions = [];
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

function isGistNew(id, done){
	if(filesystem){
		fs.readFile(`data/gistbot-${date}.txt`, 'utf8', function(err, res){
			if(err || res.indexOf(id) === -1){
				fs.appendFileSync(`data/gistbot-${date}.txt`, id+'\n');
				return done(1);
			}

			return done(0);
		});
	}
	else{
		if(cache.indexOf(id) === -1){
			cache.push(id);
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
				if(!languages) return true;
				
				var flag = false;
				Object.keys(el.files).forEach((file)=>{
					if(languages.split(',').indexOf(el.files[file].language) !== -1){
						flag = true;
					}
				});
				return flag;
			});
			filtered.forEach((gist)=>{
				isGistNew(gist.id, (itsNew)=>{
					if(!itsNew) return;

					gist.description = (gist.description || 'No Description Available').replace(/\n/g, ' ');
					if(gist.description.length > lineWidth){
						gist.description = gist.description.slice(0, lineWidth);
						console.log(`${gist.description} (${gist.html_url})`);
					}
					else{
						console.log(`${gist.description}${' '.repeat(lineWidth - gist.description.length)} (${gist.html_url})`);
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

function help(){
	console.log('Usage: node gist-bot.js [options]');
	console.log('');
	console.log('Options:');
	console.log('\t-v            print gistbot version');
	console.log('\t-h            print this message');
	console.log('\t-f            save ids in a file instead of memory');
	console.log('\t-l LANGUAGES  comma separated languages to watch for');
	console.log('\t-i INTERVAL   seconds between each poll');
	console.log('\t-r FILENAME   file containing one regex/line to check in the raw files');

	process.exit();
}

function version(){
	fs.readFile('./package.json', 'utf8', (err, res)=>{
		console.log(JSON.parse(res).version);
		process.exit();
	});
}

function error(type){
	if(type === 0){
		console.log('Wrong arguments or missing..');
	}

	process.exit();
}

function main(){
	var value;
	
	process.argv.shift();
	process.argv.shift();

	if(process.argv.indexOf('-h') !== -1) return help();
	if(process.argv.indexOf('-v') !== -1) return version();

	if(process.argv.indexOf('-l') !== -1){
		value = process.argv[process.argv.indexOf('-l')+1];
		if(!value) return error(0);

		languages = value;
	}

	if(process.argv.indexOf('-i') !== -1){
		value = process.argv[process.argv.indexOf('-i')+1];
		if(!value || !/^[0-9]+$/.test(value)) return error(0);

		interval = parseInt(value)*1000;
	}

	if(process.argv.indexOf('-f') !== -1){				
		filesystem = 1;
	}

	if(process.argv.indexOf('-r') !== -1){
		value = process.argv[process.argv.indexOf('-r')+1];
		if(!value) return error(0);


		fs.readFile(value, 'utf8', (err, res)=>{
			if(err) return error(0);

			regularExpressions = res.split('\n');
		});
	}

	fetchData();
	setInterval(fetchData, interval);
}

main();