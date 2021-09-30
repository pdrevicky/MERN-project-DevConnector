const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');


// User Model

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access    Public
router.post('/',[
    // name is required check if is there
    check('name', 'Name is required').not().isEmpty(),
    // email if email is valid
    check('email', 'Please include a valid email').isEmail(),
    // password must have six or more char
    check('password', 'Please enter a password with 6 or more characters').isLength({
        min: 6
    })
    // Is async cause in Try block we will use async methods
], async (req, res) => {
    const errors = validationResult(req);
    // if we have errors
    if(!errors.isEmpty()){
        // errors.array is a method in errors
        // send error response 
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;


    try{ 
        // See if user exists
        // We can also do email: email cause de
        let user = await User.findOne({ email})

        if(user){
            // Error is in object to match the error type of exp. name is required error above
            return res.status(400).json({errors: [{ msg: 'User already existrs'}]})
        }

        // Ger Users gravatar - default img , gravatar is a library
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })
        // only create a instance of User not saved it
        user = new User({
            name,
            email,
            avatar,
            password
        })

        // Encrypt password
        // All await return promise
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save()
    
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