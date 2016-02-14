const https = require('https');
const fs = require('fs');

const config = require('./config');
const date = `${(new Date()).getDate()}-${(new Date()).getMonth()}-${(new Date()).getFullYear()}`;

var languages = 'JavaScript,Shell';
var interval = 30000;
var lineWidth = 80;
var filesystem = 0;
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
				var flag = false;
				Object.keys(el.files).forEach((file)=>{					
					if(languages.split(',').indexOf(el.files[file].language) !== -1){
						flag = true;
					}
				})
				return flag;
			});
			filtered.forEach((gist)=>{
				isGistNew(gist.id, (itsNew)=>{
					if(!itsNew) return;

					gist.description = gist.description.replace(/\n/g, ' ');
					if(gist.description.length > lineWidth){
						gist.description = gist.description.slice(0, lineWidth);
						console.log(`${gist.description} (${gist.html_url})`);
					}
					else{
						console.log(`${gist.description}${' '.repeat(lineWidth - gist.description.length)} (${gist.html_url})`);
					}
				});
			})
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
	console.log('\t-l LANGUAGES  comma separated languages to watch for');
	console.log('\t-i INTERVAL   seconds between each poll');
	console.log('\t-f            save in file instead of memory');

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
	process.argv.shift();
	process.argv.shift();

	if(process.argv.indexOf('-h') !== -1) return help();
	if(process.argv.indexOf('-v') !== -1) return version();

	if(process.argv.indexOf('-l') !== -1){
		var value = process.argv[process.argv.indexOf('-l')+1];
		if(!value) return error(0);

		languages = value;
	}

	if(process.argv.indexOf('-i') !== -1){
		var value = process.argv[process.argv.indexOf('-i')+1];
		if(!value || !/^[0-9]+$/.test(value)) return error(0);

		interval = parseInt(value)*1000;
	}

	if(process.argv.indexOf('-f') !== -1){				
		filesystem = 1;
	}

	setInterval(fetchData, interval);
}

main();