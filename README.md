# ![Github Gist Bot](https://res.cloudinary.com/dkxp3eifs/image/upload/c_scale,w_500/v1455829505/gistbot/gistbot_logo.png)

### **GISTBOT** is a smart bot that watches the github gist feed and gives you the power to find in real time repositories that interest you.  
#### You have to use your **imagination** to take full advantage of it as the uses may vary depending on the person.  
#### Some may want for example to find all the lastest **Javascript** repositories that use **Angular** where some others may want to find hidden (or not so) **RSA Private Keys** :)


Usage
-
`node gistbot.js`

Options (.gistbotrc)  
-
- `loglevel` 0 for no logging and 1 for logging
- `interval` Seconds between each fetch
- `lineWidth` How many characters to print from the gist description
- `languages` What languages to watch for. Empty array to watch all
- `regexPath` Filename for the regular expressions file that contains one regex per line
- `storageType` Empty to store in memory or 'filesystem' to store in files

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
*0.0.3*
- Move options to rc file  
- Add username and description to the log tsv  

*0.0.2*
- Added *Regular Expression Watcher* option
- Minor bugfixes

*0.0.1*
- Basic functionality with in-memory and file storage options

License
-
MIT