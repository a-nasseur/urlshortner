const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { json } = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
require('dotenv').config();
const PORT = 3000; 

// Serving static files 
app.use('/public', express.static(__dirname + '/public'))

// Body Parser middleware
app.use(bodyParser.urlencoded({extended: false}));

// Database connection
mongoose.connect(process.env.DB_URI, (err) => {
    if(err){
        console.log(err)
    }
    console.log(`database connected`)
})


// DB schema

const shortUrlSchema = new Schema({
    original_url: {
        type: String,
        required: true,
        unique: true
    },
    short_url: {
        type: Number,
        unique: true, 

    }
})

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema)


// validation REGEX
const regexp =  /^(?:(?:https?|http):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;

// URL validation middleware 
const URLValidation = (req, res, next) => {
    if(regexp.test(req.body.host)){
        next();
    } else {
        return res.json({
            error: "Invalid URL"
        })
    }
}
 

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/shorturl', URLValidation, async (req, res, done) => {
    let dbEntries = await ShortUrl.find();
    let count = parseInt(dbEntries.length) + 1;
    const url = ShortUrl.create({
        original_url: req.body.host,
        short_url: count
    }, (err, data) => {
        if(err){
            console.log(err)
        }
        res.json({
            original_url: data.original_url,
            short_url: data.short_url
        });
        done(null, data);
    });
});


app.get('/api/shorturl/:shorturl', async (req, res) => {
    const url = await ShortUrl.findOne({short_url: req.params.shorturl})
    res.redirect(301, url.original_url);
});


app.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});