let redirect_uri = "http://localhost:80/index.html"

let client_id = "";
let client_secret = "";


//endpoints
const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token"
const TOP_TRACKS = "https://api.spotify.com/v1/me/top/tracks"

//main control function
function onLoad(){
  window.localStorage.setItem('client_id', client_id);
  window.localStorage.setItem('client_secret', client_secret);

  client_id = window.localStorage.getItem("client_id");
  client_secret = window.localStorage.getItem("client_secret");

  //check if redirect has happened yet
  if(window.location.search.length > 0){
    handleRedirect();
  }
  else {
    access_token = localStorage.getItem("access_token");
    if(access_token == null){
      //case: do not have access token
      document.getElementById("get-credentials").style.display = 'block';
      document.getElementById("functionality").style.display = 'none';
    }
    else{
      //case: do have access token
      document.getElementById("get-credentials").style.display = 'none';
      document.getElementById("functionality").style.display = 'block';
    }
  }
}

//configure spotify endpoint redirect
function handleRedirect(){
  let code = getCode();
  fetchToken(code);
  window.history.pushState("", "", redirect_uri); // remove param from url
}
function getCode(){
  let code = null
  const queryString = window.location.search;
  if(queryString.length > 0){
    const urlParams = new URLSearchParams(queryString);
    code = urlParams.get('code');
  }
  return code;
}

//fetch an access token
function fetchToken(code){
  let body  = "grant_type=authorization_code";
  body += "&code=" + code;
  body += "&redirect_uri=" + encodeURI(redirect_uri);
  body += "&client_id=" + client_id;
  body += "&client_secret" + client_secret;
  callAuthorizationApi(body);
}

//refresh the access token
function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}
function callAuthorizationApi(body){
  let xhr = new XMLHttpRequest();
  xhr.open("POST", TOKEN, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
  xhr.send(body);
  xhr.onload = handleAuthorizationResponse;
}

//make sure authorization works
function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            window.localStorage.setItem("access_token", access_token); //save access token to local storage
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            window.localStorage.setItem("refresh_token", refresh_token); //save refresh token to local storage
        }
        onLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

//ask for certain permissions
function requestAuthorization(){

    //REMOVE THESE 2 LINES IF CLIENT ID AND SECRET ARE DEFINED IN CODE
    //LEAVE IF GETTING VALUES FROM USER INPUT
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;


    window.localStorage.setItem('client_id', client_id);
    window.localStorage.setItem('client_secret', client_secret);

    //create url for specific endpoint
    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read user-follow-read user-library-read streaming playlist-read-collaborative user-read-email user-top-read playlist-modify-public"
    window.location.href = url;
}

//boilerplate for making an API call
function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

//FUNCTIONALITY
function findTopTracks(){
  //find the top tracks for the current user
  callApi("GET", TOP_TRACKS + "?limit=5&time_range=short_term", null, handleTopTracksResponse)
}
//handle response for findTopTracks() function
function handleTopTracksResponse(){
    //status code for correct response
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        console.log("number 1 track is: " + data.items[0].name + " by " + data.items[0].artists[0].name);
        fillTopTracksTable(data);
    }
    //token error
    else if ( this.status == 401 ){
        refreshAccessToken();
    }
    //other kind of error
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}
function fillTopTracksTable(data){
  table = document.getElementById("table");
  for(let i = 0; i<5; i++){
    console.log(i+1);
    console.log(data);
    console.log(data.items[i].name);
    let width = data.items[i].album.images[1].width;
    let height = data.items[i].album.images[1].height;
    //the html to be added
    let text = "<center><tr><th>" + (i+1) + "</th><td>" + data.items[i].name + " -" + data.items[i].artists[0].name + "</td><td><img id=\"album-cover\" src=\"" + data.items[i].album.images[1].url + "\" width=\"" + width + "\" height=\"" + height + "\"></td></tr></center>";
    table.insertAdjacentHTML('beforeend', text);
  }
}
