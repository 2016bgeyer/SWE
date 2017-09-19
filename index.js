var cool = require('cool-ascii-faces');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var express = require('express');
var app = express();
var pg = require('pg');

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


var search;
var name;
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


app.get('/reactions',function(req,res){             //#5    Stores last Search's reactions: http://localhost:5000/reactions
    res.send("Reactions: "+JSON.stringify(search[0].patient.reaction));
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


app.get('*', function(req, res, next) {
    var err = new Error();
    err.status = 404;
    next(err);
});


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
