const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth')
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');


const User = require('../../models/User')

// @route    GET api/auth
// @desc     Test route
// @access    Public

// auth is Our define middlewere and it makes route protected
router.get('/', auth, async(req, res) => {
    try{
        // In middleware we set User to be the same user that is in the token so we can access User data anywhere from protected route
        // -password  -  will not be returned in Data
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access    Public

router.post('/',[
    // email if email is valid
    check('email', 'Please include a valid email').isEmail(),
    // password exists
    check('password', 'Passord is required').exists()
    // Is async cause in Try block we will use async methods
], async (req, res) => {
    const errors = validationResult(req);
    // if we have errors
    if(!errors.isEmpty()){
        // errors.array is a method in errors
        // send error response 
        return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try{ 
        // See if user exists
        // We can also do email: email cause de
        let user = await User.findOne({ email})

        if(!user){
            // Error is in object to match the error type of exp. name is required error above
            return res.status(400).json({errors: [{ msg: 'Invalid Credentials'}]})
        }
        // compare plain password and crypted password
        // request for user was made line  let user = await User.findOne({ email})
        const isMatch = await bcrypt.compare(password, user.password);
    
        if(!isMatch){
            // Error is in object to match the error type of exp. name is required error above
            return res.status(400).json({errors: [{ msg: 'Invalid Credentials'}]})
        }

        // Return jsonwebtoken
        // Same user that was saved , same id as in mongoDB _id
        const payload = {
            user: {
                id: user.id
            }
        }

        // secret token from 
        jwt.sign(payload, config.get('jwtSecret'),
        {expiresIn: 360000}, (err,token)=>{
            if(err) throw err;
            res.json({ token });
        });

    }catch(err){
        console.error(err.message);
    }
   });

module.exports = router;