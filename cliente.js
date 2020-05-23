const https          = require('https');
const http           = require('http');
const express        = require('express');
const faker          = require('faker');
const bodyParser     = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const app            = express();
const portHttps      = process.env.PORT || 9999;
const portHttp       = process.env.PORT || 9998;
const fs   		     = require('fs');
  
var options = {
    pfx: fs.readFileSync('./Trasmontano.pfx'),
    passphrase: 'infra@Tras1'
}; 

app.set('view engine', 'ejs')     // Setamos que nossa engine será o ejs
app.use(expressLayouts)           // Definimos que vamos utilizar o express-ejs-layouts na nossa aplicação
app.use(bodyParser.urlencoded())  // Com essa configuração, vamos conseguir parsear o corpo das requisições

app.use(express.static(__dirname + '/public'))

//app.use(function(req, res, next) {
//
//console.log(req.get('Host'));
//
//  if(req.headers['x-forwarded-proto']==='http') {
//    return res.redirect(['https://', req.get('Host'), req.url].join(''));
//  }
//  next();
//});

//app.listen(port, () => {
//    console.log(`A mágica acontece em http://localhost:${port}`)
//})

https.createServer(options, app)
.listen(portHttps, function () {
  console.log('Rodando na sobre a port ${portHttps}! Go to https://localhost:${portHttps}/')
})

https.createServer(options, app)
.listen(portHttp, function () {
  console.log('Rodando na sobre a port ${portHttp}! Go to http://localhost:${portHttp}/')
})

app.get('/', (req, res) => {
    res.render('pages/home')
})

app.get('/contato', (req, res) => {
    res.render('pages/contato')
})

app.post('/contato', (req, res) => {
    res.send('Obrigado por entrar em contato conosco, ' + req.body.name + '! Responderemos em breve!')
})