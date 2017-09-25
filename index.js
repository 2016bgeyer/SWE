var cool = require('cool-ascii-faces');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const express = require('express');
const nock = require('nock');
const fetch=require('node-fetch');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

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


class xhr extends XMLHttpRequest{
    opens(query){
        this.open("GET", `https://api.fda.gov/drug/event.json${query}`, false);
        this.send(null);
        return JSON.parse(this.responseText);
    }
}




app.get('/count/:info', function(req, res) {       //#1     http://localhost:5000/count/patient.reaction.reactionmeddrapt.exact
    var xhr1 = new xhr();
    var count = xhr1.opens(`?count=${req.params.info}`);
    res.send(count);
});
app.get('/stats/:info', function(req, res){         //#2    http://localhost:5000/stats/patient.reaction.reactionmeddrapt.exact
    let xhr1 = new xhr();
    let count = xhr1.opens(`?count=${req.params.info}`).results;
    res.send(`${count[0].term} occurs the most at ${count[0].count} times and ${count[count.length-1].term} occurs the least at ${count[count.length-1].count} times.`);
});
class streak{
    constructor(month, size){
        this.month = month;
        this.size = size;
    }
}


app.get('/commonmonth', function(req, res){         //#3    finds the most advrse druge effects during one month: http://localhost:5000/commonmonth
    let xhr1 = new xhr();
    let count = xhr1.opens(`?count=receiptdate`).results;
    let current = new streak(0, 0);
    let longest = new streak(0, 0);
    for(let date of count){
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
    res.send(`The month with the most adverse drug events is month ${longest.month}.`);
});


// var search;
var search = fetch('https://api.fda.gov/drug/event.json?count=patient.patientsex%27').then(function(dataRes) {
    console.log("fetch");
    return dataRes.json();
});
var name;

app.get('/ADD_Reaction/:reaction', function(req, res){


    fetch('',
        {
            method: "POST"
        }).then(function(dataRes) {
        console.log("fetch");
        search[0].patient.reaction.push({"reactionoutcome":"100","reactionmeddraversionpt":"20","reactionmeddrapt":req.params.reaction});
        return dataRes.json();
    });
    console.log("post");

    res.send(search[0].patient.reaction);

});
app.get('/ADD_Reaction/:reaction', function(req, res){


    fetch('',
        {
            method: "PUT"
        }).then(function(dataRes) {
        console.log("fetch");
        return dataRes.json();
    });
    console.log("post");

    search[0].patient.reaction.push({"reactionoutcome":"100","reactionmeddraversionpt":"20","reactionmeddrapt":req.params.reaction});
    res.send(search[0].patient.reaction);

});

var name;
app.post('/add/users', function(req, res) {
    var user_id = req.body.id;
    var token = req.body.token;
    var geo = req.body.geo;

    res.send(user_id + ' ' + token + ' ' + geo);
});



app.route('/:count/:query/:field/:name')
    .get(function(req, res,next) {                  //#4       SEARCH FUNCTION THAT GETS, PUTS, AND DELETES): http://localhost:5000/1/search/reactionmeddrapt/headache
        var xhr1 = new xhr();
        name=req.params.name;
        search = xhr1.opens(`?${req.params.query}=patient.reaction.${req.params.field}:"${req.params.name}"&limit=${req.params.count}`).results;
        next();
    }, function(req,res){
        res.send(search);
    }).delete(function(req,res){
    res.send("Deleted Search");
}).post(function(req,res){
    res.send("POST Test")
}).put(function(req,res){
    search = xhr1.opens(`?${req.params.query}=patient.reaction.${req.params.field}:"${req.params.name}"&limit=10`).results;
    console.log(`?${req.params.query}=patient.reaction.${req.params.field}:"${req.params.name}"&limit=10`);
    res.send(search);
});

app.put('/search', function(req,res){
    // var reactions = req.body.reactions;
    // res.end('Reactions: ' + reactions);
    search=search[0].patient.reaction

    res.send(search)
});
//     res.send("Reactions: "+JSON.stringify(search[0].patient.reaction));
// });



app.get('/reactions',function(req,res){             //#5    Stores last Search's reactions: http://localhost:5000/reactions



    res.send("Reactions: "+JSON.stringify(search[0].patient.reaction));
    // res.send('Reactions:',search[0].patient.reaction)
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
