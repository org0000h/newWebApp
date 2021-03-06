let express = require('express');
let router = express.Router();
let jwt = require('jsonwebtoken');
let crypto = require('crypto');
let userModel = require('../persistence/models/user');
let auth = require("../others/auth");
const check = require('../others/chack_fields');
//REST API
router.post('/user/login',  userLoginRouter);
router.post('/user/logout', userLogoutRouter);

SALT = "salt9900";

class REQ_USER{
  constructor(req, userm){
    this.user_id = req.body.user_id;
    if(userm == null){//not exist
      this.exist = false;
    }else{
      this.exist = true;
      this.token_version = userm.token_version;
      this.username = userm.user_name;
      this.password = userm.password;
    }
  }

  checkPasswd(passwd){
    if(this.exist){
      if(passwd != this.password){ 
        let err = new Error("user wrong password");
        err.code = 401;
        throw err;
      }
    }else{
      let err = new Error("user is not exist");
      err.code = 401;
      throw err;
    }
  }

  checkExist(){
    if(!this.exist){
      let err = new Error("user not exist");
      err.code = 404;
      throw err;
    }
  }
}

function ResponseError(res, errRes){
  res.shouldKeepAlive = false;
  let code = 500;
  if(errRes.code != undefined){
    code = errRes.code;
  }
  res.status(code);  
  let response_json = {
    code:code,
    message:errRes.message
  }
  res.json(response_json);
  res.end();
}

function ResponseUserLoginOK(res, token){
  let response_json = {
    code: 0,
    "token": token
  };
  res.json(response_json);
  res.shouldKeepAlive = false;
  res.status(200);
  res.end();
}

async function  userLoginRouter(req, res){
  console.log("login:",req.body);
  try{
    let body_fields = ["password","user_id"];
    check.checkRequestFields(req, body_fields);
    let userm = await userModel.findOne({ where: {user_id:req.body.user_id} });
    let user = new REQ_USER(req,userm);
    user.checkExist();
    user.checkPasswd(req.body.password);
    let userTokenVersion = Date.now();
    auth.saveTokenVersion(userTokenVersion,userm);
    let tokenPayload = auth.createTokenPayload(user.user_id,userTokenVersion);
    let secret = await auth.createSecret(tokenPayload.toString(), SALT);
    let token = auth.createToken(secret, tokenPayload);
    ResponseUserLoginOK(res, token);
    return;
  }catch(err){
    console.log(err.message);
    ResponseError(res, err);
  }

}

function userLogoutRouter(req, res){
//todo
}



module.exports = router;