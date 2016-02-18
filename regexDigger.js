const https = require('https');
const fs = require('fs');
// TODO: Promisify process instead of using callbacks..
function appendRegexMap(file, regex, regexname, data, done){
	fs.readFile('data/regex.map.tsv', 'utf8', (err, res)=>{
		if(err) {
			fs.writeFile('data/regex.map.tsv', `0\t${regex}\t${file}\n`, (err, res)=>{
				if(err) return done(err);

				fs.writeFile(`data/${regexname}/0`, data, 'utf8', (err, res)=>{
					if(err) return done(err);

					done()
				});
			});
		}
		else if(res.indexOf(file) === -1){
			res = res.split('\n')			
			res = res[res.length-2]
			res = res.split('\t')
			res = res.shift();
			var id = parseInt(res)+1;
			fs.appendFile('data/regex.map.tsv', `${id}\t${regex}\t${file}\n`, (err, res)=>{
				if(err) return done(err);

				fs.writeFile(`data/${regexname}/${id}`, data, 'utf8', (err, res)=>{
					if(err) return done(err);

					done();
				});
			});
		}
	});
}

function checkRegexFolder(regexname, done){
	fs.stat(`data/${regexname}`, (err, res)=>{
		if(!err) return done();

		fs.mkdirSync(`data/${regexname}`);
		done();
	});			
}

function save(file, regex, data){
	var regexname = regex.replace(/\W/g, '');

	checkRegexFolder(regexname, ()=>{
		appendRegexMap(file, regex, regexname, data, (err)=>{
			if(err) return console.log(err);
		});			
	});
}

function start(args) {
	var files = args.files; // es6 destruct
	var regularExpressions = args.regularExpressions;

	files.forEach((file)=>{
		var req = https.get(file, (res)=>{
			var data = '';

			res.on('data', (d)=>{
				data+=d;
			});

			res.on('end', ()=>{
				for (var i = 0; i < regularExpressions.length; i++) {
					if(regularExpressions[i] && data.match(new RegExp(regularExpressions[i], 'i'))){
						save(file, regularExpressions[i], data);
					}
				}
			});
		});

		req.end();

		req.on('error', (e)=>{
			console.error(`Error fetching gist ${file}. ${e}`);
		});
	});
}

module.exports = {
	start: start
};