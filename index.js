const cool = require('cool-ascii-faces');
const express = require('express');
const nock = require('nock');
const fetch=require('node-fetch');
const app = express();
const pg = require('pg');
const Canvas = require("canvas");
const cloud = require("d3-cloud-master/");
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

const firebase = require("firebase");
// Initialize Firebase
const fireConfig = {
    apiKey: "AIzaSyCOXM_GoJ2Iod--inOSZ7ADgf6E1ol1Ifg",
    authDomain: "database-868b8.firebaseapp.com",
    databaseURL: "https://database-868b8.firebaseio.com",
    projectId: "database-868b8",
    storageBucket: "database-868b8.appspot.com",
    messagingSenderId: "115155038268"
};0
firebase.initializeApp(fireConfig);

let database = firebase.database();
database.ref('users/' + 'Josh').set(
    {username: 'Ben', email: 'b@gmail.com'
    });

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/*
5 Services:
1. Count number of records where phrases occur
2.Perform computation based on those numbers
3.Most common month
4.Search Illness Route/Page:  GET, PUT, DELETE
5.Current Illness Route/Page statistics: GET, POST
 */

//#1     http://localhost:5000/count/patient.reaction.reactionmeddrapt.exact
app.get('/count/:info', function(req, res) {
    fetch(`https://api.fda.gov/drug/event.json?count=${req.params.info}`)
        .then(function(dataRes){
            return dataRes.json();
        }).then(function(json){
            res.send(json.results);
    }).catch(function(err) {
        fetch(`https://api.fda.gov/drug/event.json?count=${req.params.info}`)
            .then(function(dataRes){
                return dataRes.json();
            }).then(function(json){
            res.send(json.results);
        });
        console.log("err", err);
        throw new Error("An error occurred");
    });
});

//#2    http://localhost:5000/stats/patient.reaction.reactionmeddrapt.exact
app.get('/stats/:info', function(req, res){
    fetch(`https://api.fda.gov/drug/event.json?count=${req.params.info}`)
        .then(function(dataRes){
            return dataRes.json();
        }).then(function(json){
            return json.results;
        }).then(function(data){
            res.send(`${data[0].term} occurs the most at ${data[0].count} times and ${data[data.length-1].term} occurs the least at ${data[data.length-1].count} times.`);
        }).catch(function(err) {
        console.log("err", err);
        throw new Error("An error occurred");
    });
});

class streak{
    constructor(month, size){
        this.month = month;
        this.size = size;
    }
}

//#3    finds the month with the most adverse drug events: http://localhost:5000/commonmonth
app.get('/commonmonth', function(req, res){
    let current;
    let longest;
    Promise.all([fetch('https://api.fda.gov/drug/event.json?count=receiptdate'), current=new streak(0,0), longest=new streak(0,0)])
        .then(function(dataRes) {
            return dataRes[0].json();
        }).then(function(json) {
            for(let date of json.results){
                let time = parseInt(date.time.substring(4,6));
                if(current.month == time){
                    current.size += parseInt(date.count);
                    if(current.size > longest.size){
                        longest = current;
                    }
                }
                else{
                    current = new streak(time, parseInt(date.count));
                }
            }
        }).then(function() {
            res.send(`The month with the most adverse drug events is month ${longest.month}.`)
    }).catch(function(err) {
        console.log("err", err);
        throw new Error("An error occurred");
    });
});

class Symptoms{
    constructor(json){
        this.json = json;
    }
    showSymptoms(){
        let text = [];
        for(let symptom of search[0].patient.reaction)
            text.push(symptom.reactionmeddrapt);
        return text;
    }
}

let search;
//#4       SEARCH FUNCTION: http://localhost:5000/2/search/reactionmeddrapt/headache
app.get('/:count/:query/:field/:name', function(req, res){
    fetch(`https://api.fda.gov/drug/event.json?${req.params.query}=patient.reaction.${req.params.field}:"${req.params.name}"&limit=${req.params.count}`)
.then(function(dataRes){
        return dataRes.json();
    }).then(function(json){
        search = json.results;
        let symptoms=new Symptoms(search);
        return symptoms;
    }).then(function(symptoms){
        res.send(symptoms.showSymptoms());
    });
});

//#5    Stores last Search's symptoms: http://localhost:5000/Search_symptoms
app.get('/Search_symptoms',function(req,res){
    if(search) {
        let symptoms = new Symptoms(search);
        res.send("First Symptoms: " +symptoms.showSymptoms());
    }
    else
        res.send("A search has not been performed yet.");
});

//#6    Adds symptoms to latest search. http://localhost:5000/addSymptom/coughing/
app.get('/addSymptom/:symptom', function(req, res){
    if(search){
        search[0].patient.reaction.push({"reactionmeddrapt":req.params.symptom});
        let symptom = new Symptoms(search);
        res.send(symptom.showSymptoms());
    }
    else
        res.send("A search has not been performed yet.");
});

let tweets = {};
setInterval(() => {
    if (search) {
        fetch(`http://api.flutrack.org/?s=${search[1].patient.reaction[0].reactionmeddrapt}OR${search[1].patient.reaction[1].reactionmeddrapt}`)
        .then(function (dataRes) {
            return dataRes.json();
        }).then(function (json) {
            tweets = json;
        }).catch(function(err) {
            console.log("err", err);
            throw new Error("An error occurred");
        });
    }
}, 1000);

class twitter{
    constructor(json){
        this.json = json;
    }
    showTweets(){
        let text = [];
        for(let tweet of tweets)
            text.push(tweet.tweet_text);
        return text;
    }
}

//#7       Searches flutrack for symptoms specified: http://localhost:5000/tweets/
app.get('/tweets', function(req, res) {
    if (tweets&&search) {
        let results = new twitter(tweets);
        res.send(results.showTweets());
    }
    else
        res.send("A search has not been performed yet.");
});


app.get('/wordcloud/', function(req, res) {
    // if (tweets&&search) {
        res.render('pages/wordcloud');
    // }
    // else
    //     res.send("A search has not been performed yet.");
});

//leaving this alone
app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
    response.send(cool());
});

app.get('/users/:userId/books/:bookId', function(request, response) {
    response.send(request.params);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// app.get('*', function(req, res, next) {
//     var err = new Error();
//     err.status = 404;
//     next(err);
// });

/*
//ERROR HANDLING!!
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});*/