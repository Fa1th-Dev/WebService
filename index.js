const express = require('express');
const app = express();
let bodyParser = require('body-parser')
app.use(bodyParser.raw({type:"*/*"}))
const fs = require("fs")
var cors = require('cors')
app.use(cors())

let id = 0;
let AccountDB = new Map()
let ChannelRepository = new Map()
let tokenArray = []
let tokenDB = new Map()


app.post("/signup", (req, res) => {
  let userName = JSON.parse(req.body).username
  let password = JSON.parse(req.body).password

    if (userName === undefined){
      return res.send(JSON.stringify({success:false,reason:"username field missing"}))
        return
    }
    if (password === undefined){
      return res.send(JSON.stringify({success:false,reason:"password field missing"}))
        return
    }
    if (AccountDB.has(userName)) {
        return res.send(JSON.stringify({success : false, reason: "Username exists"}))
        return
    }
    AccountDB.set(userName, {"password": password})
    return res.send(JSON.stringify({success : true}))
})

app.post("/login", (req, res)=> {
  let userName = JSON.parse(req.body).username
  let password = JSON.parse(req.body).password
        if (userName === undefined){
      return res.send(JSON.stringify({success:false,reason:"username field missing"}))
        return
    }
    if (password === undefined){
      return res.send(JSON.stringify({success:false,reason:"password field missing"}))
    }
    if (AccountDB.get(userName)===undefined){
      return res.send(JSON.stringify({success : false, reason : "User does not exist"}))
    }else if (AccountDB.get(userName).password !== password){
      return res.send(JSON.stringify({success : false, reason : "Invalid password"}))
    }
    else{
    let loginInfo = AccountDB.get(userName)
    let token = "t" +id
    loginInfo.token = token
    AccountDB.set(userName, loginInfo)
    tokenArray.push(token)
    tokenDB.set(token, {"userName": userName})
    id++
    return res.send(JSON.stringify({success:true,"token": token}))
    }
  
})

app.post("/create-channel", (req,res)=> {
  let tokenHeader = (req.headers).token
  let requestedChannelName = JSON.parse(req.body).channelName
  
  if (tokenHeader === undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (requestedChannelName === undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
  else if (ChannelRepository.get(requestedChannelName) !== undefined){
    return res.send(JSON.stringify({success:false, reason: "Channel already exists"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else {
    ChannelRepository.set(requestedChannelName, {"owner": tokenDB.get(tokenHeader).userName, "channelUserList": [], "channelBanList": [], "messagesHistory": []})
    return res.send(JSON.stringify({success:true}))
  }
})
app.post("/join-channel", (req,res) => {
  let requestedChannelName = JSON.parse(req.body).channelName
  let tokenHeader = (req.headers).token
  if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (requestedChannelName===undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
    else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (ChannelRepository.get(requestedChannelName)===undefined){
    return res.send(JSON.stringify({success:false, reason: "Channel does not exist"})) 
  }
  let person = tokenDB.get(tokenHeader).userName
  let thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
  let thisSpecificChannelBanList = ChannelRepository.get(requestedChannelName).channelBanList
  if (thisSpecificChannelUserList.includes(person)){
    return res.send(JSON.stringify({success:false, reason: "User has already joined"}))
  }
  else if (thisSpecificChannelBanList.includes(person)){
    return res.send(JSON.stringify({success:false, reason: "User is banned"}))
  }
  else{
    thisSpecificChannelUserList.push(person)
    let channelDetail = ChannelRepository.get(requestedChannelName)
    channelDetail.thisSpecificChannelUserList = thisSpecificChannelUserList
    ChannelRepository.set(requestedChannelName, channelDetail)
    console.log("this user:" +person + "has join this channel:" +requestedChannelName)
    return res.send(JSON.stringify({success:true}))
  }
})
app.post("/leave-channel", (req,res) => {
  let requestedChannelName = JSON.parse(req.body).channelName
  let tokenHeader = (req.headers).token
    if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
    else if (requestedChannelName===undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
    else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
    else if (ChannelRepository.get(requestedChannelName)===undefined){
    return res.send(JSON.stringify({success:false, reason: "Channel does not exist"})) 
  }
    let person = tokenDB.get(tokenHeader).userName
    let thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
    if (!(thisSpecificChannelUserList.includes(person))){
    return res.send(JSON.stringify({success:false, reason: "User is not part of this channel"}))
  }
    else{
    function arrayRemove(arr, value) 
    { return arr.filter(function(ele){ return ele != value; });}
    ChannelRepository.get(requestedChannelName).channelUserList = arrayRemove(thisSpecificChannelUserList, person);
    let channelDetail = ChannelRepository.get(requestedChannelName)
    channelDetail.thisSpecificChannelUserList = thisSpecificChannelUserList
    ChannelRepository.set(requestedChannelName, channelDetail)
    return res.send(JSON.stringify({success:true}))
  }
})
app.get("/joined", (req,res) => {
  let requestedChannelName = req.query.channelName
  let tokenHeader = (req.headers).token
  if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (ChannelRepository.get(requestedChannelName) === undefined){
    return res.send(JSON.stringify({success:false,reason: "Channel does not exist"}))
  }
  let person = tokenDB.get(tokenHeader).userName
  let thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
  if (!thisSpecificChannelUserList.includes(person)){
    return res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
  }
  else {
    thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
    return res.send(JSON.stringify({success:true,joined:thisSpecificChannelUserList}))
  }
})
app.post("/delete", (req,res) => {
  let tokenHeader = (req.headers).token
  let requestedChannelName = JSON.parse(req.body).channelName
  
    if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (requestedChannelName===undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (ChannelRepository.get(requestedChannelName)===undefined){
    return res.send(JSON.stringify({success:false, reason: "Channel does not exist"})) 
  }
  else {
    console.log("Deleting, this may cause error.... Need to delete array too")
    console.log("channel deleted:" + requestedChannelName)
    ChannelRepository.delete(requestedChannelName)
    return res.send(JSON.stringify({success:true}))
  }
})

app.post("/kick", (req,res) => {
  let tokenHeader = (req.headers).token
  let requestedChannelName = JSON.parse(req.body).channelName
  let requestedTarget = JSON.parse(req.body).target
  console.log("kicking target :" + requestedTarget)

 
  
  if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (requestedChannelName === undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
  else if (requestedTarget === undefined){
    return res.send(JSON.stringify({success:false, reason: "target field missing"}))
  }
  let person = tokenDB.get(tokenHeader).userName
  let channelOwner = ChannelRepository.get(requestedChannelName).owner
  if (channelOwner!== person){
    return res.send(JSON.stringify({success:false, reason: "Channel not owned by user"}))
  }
  else {
    let thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
    function arrayRemove(arr, value) 
    { return arr.filter(function(ele){ return ele != value; });}
    ChannelRepository.get(requestedChannelName).channelUserList = arrayRemove(thisSpecificChannelUserList, requestedTarget);
    return res.send(JSON.stringify({success:true}))
  }
})

app.post("/ban", (req,res) => {
  let tokenHeader = (req.headers).token
  let requestedChannelName = JSON.parse(req.body).channelName
  if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (requestedChannelName === undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
  let requestedTarget = JSON.parse(req.body).target
  console.log("Banning target :" + requestedTarget)
  if (requestedTarget === undefined){
    return res.send(JSON.stringify({success:false, reason: "target field missing"}))
  }
  let person = tokenDB.get(tokenHeader).userName
  let channelOwner = ChannelRepository.get(requestedChannelName).owner
  if (channelOwner!== person){
    return res.send(JSON.stringify({success:false, reason: "Channel not owned by user"}))
  }
  else {
    let thisSpecificChannelBanList = ChannelRepository.get(requestedChannelName).channelBanList
    
    thisSpecificChannelBanList.push(requestedTarget)
    let channelDetail = ChannelRepository.get(requestedChannelName)
    channelDetail.thisSpecificChannelBanList = thisSpecificChannelBanList
    ChannelRepository.set(requestedChannelName, channelDetail)
    return res.send(JSON.stringify({success:true}))
  }
})

app.post("/message", (req,res) => {
  let tokenHeader = (req.headers).token
  console.log("tokenHeader:" + tokenHeader)
  let requestedChannelName = JSON.parse(req.body).channelName
  console.log("requestedChannelName:" + requestedChannelName)
  let thisSpecificChannelUserList
  
    if (tokenHeader===undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (requestedChannelName === undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
  let contents = JSON.parse(req.body).contents
  if (contents === undefined){
    return res.send(JSON.stringify({success:false, reason: "contents field missing"}))
  }
   
  if (ChannelRepository.get(requestedChannelName) !== undefined){
  thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
  }
  let person = tokenDB.get(tokenHeader).userName 

  if(person === undefined){
    return res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
  }
  if (thisSpecificChannelUserList === undefined){
    return res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
  }
   if (!thisSpecificChannelUserList.includes(person)){
    return res.send(JSON.stringify({"success":false,"reason":"User is not part of this channel"}))
  }
  else {
    let message = {from:person, contents:contents}
    ChannelRepository.get(requestedChannelName).messagesHistory.push(message)
    return res.send(JSON.stringify({success:true}))
  }
})

app.get("/messages", (req,res) => {
  let tokenHeader = (req.headers).token
  let requestedChannelName = req.query.channelName

  
    if (requestedChannelName === undefined){
    return res.send(JSON.stringify({success:false, reason: "channelName field missing"}))
  }
    else if (ChannelRepository.get(requestedChannelName)===undefined){
    return res.send(JSON.stringify({success:false, reason: "Channel does not exist"})) 
  }
  let person = tokenDB.get(tokenHeader).userName
  let thisSpecificChannelUserList = ChannelRepository.get(requestedChannelName).channelUserList
   if (!thisSpecificChannelUserList.includes(person)){
    return res.send(JSON.stringify({success:false,"reason":"User is not part of this channel"}))
  }
  else {
    let messagesHistory = ChannelRepository.get(requestedChannelName).messagesHistory
    return res.send({"success":true, "messages":messagesHistory})
  }
})

app.get("/sourcecode", (req, res) => {
res.send(require('fs').readFileSync(__filename).toString())
})

app.listen(process.env.PORT || 3000)