# **Github GIST bot**

Usage
-
`node gist-bot.js [options]`

Options
-
- **-v**  
Print gistbot version  
- **-h**  
Print help message  
- **-l LANGUAGE**  
Comma separated languages to watch for e.g JavaScript,Shell,Java,Python  
- **-i INTERVAL**  
Seconds between each poll  
- **-f**  
Save the ids in a file instead of memory  

TIPS
-
- Github allows only **60 calls per IP/hour** for unauthenticated calls so if you want to use the **5000 calls per IP/hour** you have to create a `config.js` file and add your Github **clientId** and **clientSecret** in.  You can find more info here https://developer.github.com/v3/#rate-limiting  
`module.exports = { clientId: 'xxx', clientSecret: 'yyy' };`
- Fetch a gist using it's id `https://api.github.com/gists/<gistId>`

Releases
-
*0.0.1*
- Basic functionality with in-memory and file storage options

License
-
MIT