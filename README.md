# **Github GIST bot**

Usage
-
`node gistbot.js [options]`

Options
-
- **-v**  
Print gistbot version  
- **-h**  
Print help message  
- **-f**  
Save the ids in a file instead of memory  
- **-l LANGUAGE**  
Comma separated languages to watch for e.g JavaScript,Shell,Java,Python  
- **-i INTERVAL**  
Seconds between each poll  
- **-r FILENAME**  
File containing one regex/line to check in the raw files  

TIPS
-
- Github allows only **60 calls per IP/hour** for unauthenticated calls so if you want to use the **5000 calls per IP/hour** you have to create a `config.js` file and add your Github **clientId** and **clientSecret** in.  You can find more info here https://developer.github.com/v3/#rate-limiting  
`module.exports = { clientId: 'xxx', clientSecret: 'yyy' };`
- Fetch a gist using it's id `https://api.github.com/gists/<gistId>`

TODO
-
- Find a better way to store the regex findings
- Add database support
- Add callback url support to post results to a webserver

Releases
-
*0.0.2*
- Added *Regular Expression Watcher* option
- Minor bugfixes

*0.0.1*
- Basic functionality with in-memory and file storage options

License
-
MIT
