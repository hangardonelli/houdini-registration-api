const bcrypt = require('bcrypt');
const md5 = require('md5');

function encryptPassword(password, digest=true) {
    if(digest) {
      password = md5(password);
    }
  
    let swappedHash = password.slice(16, 32)
    swappedHash += password.slice(0, 16);
    return swappedHash;
  }
  
  function getLoginHash(password, rndk) {
    let key = encryptPassword(password, false);
    key += rndk;
    key += 'Y(02.>\'H}t":E1';
  
    const loginHash = encryptPassword(key);
  
    return loginHash;
  }
  
  
  
function getLoginHashSalt(pw){
    let loginHash = md5(pw).toUpperCase();
    loginHash = getLoginHash(
      loginHash, 
      'houdini'
    );

    return loginHash;
}

async function comparePassword(pw, hash){  
  return await bcrypt.compare(getLoginHashSalt(pw), hash)
}

async function generateHash(pw){
    console.log("[INFO] Hasheando password")
  return await bcrypt.hash(getLoginHash(pw), 12);
}

module.exports = {comparePassword, generateHash}

