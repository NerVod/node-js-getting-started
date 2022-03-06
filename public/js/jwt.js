const jwt = require('jwt');

function generateAccessToken(user) {
    return jwt.sign(user, process.env.JWTPRIVATEKEY, {expiresIn: '1800s'});
}

const user = {};

const accessToken = generateAccessToken(user)
console.log('accessToken', accessToken)