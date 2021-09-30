const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const {check, validationResult} = require('express-validator');


const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { populate } = require('../../models/Profile');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access    Private

// if you want to protect route you have to add auth as a second parameter to router which is our created middleware is imported above
router.get('/me', auth, async (req, res) => {
    try{
        // first parameter in findOne ==> user is user in Profile Model key which is define by user.id
        // populate will add stuff to profile from user in this case name and avatar.
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({msg: 'There is no profile for this user'})
        }

        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/profile/me
// @desc     Create or update user profile
// @access   Private
router.post('/',[auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skill is required').not().isEmpty()
]], async(req,res)=>{
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()})
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body
    
    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = youtube;
    if (instagram) profileFields.social.instagram = instagram;

    try{
        // since we are using async-await when we use mongoose method we need to add await in-front of it
        let profile = await Profile.findOne({user: req.user.id});

        if(profile){
            // Update profile
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id}, 
                { $set: profileFields},
                { new: true}
                );

                return res.json(profile);
        }

        // Create profile
        profile = new Profile(profileFields);
        await profile.save();

        res.json(profile);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async(req,res) =>{
                                            //populate profiles from user and get name and avatar
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async(req,res) =>{
    //populate profiles from user and get name and avatar
try {                                   // get user_id from route
const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar'])

if(!profile) return res.status(400).json({msg: 'Profile not found'});

res.json(profile);
} catch (err) {
console.error(err.message);
// If it is certain kind of error in this case ObjectId type of error
if(err.kind == 'ObjectId'){
    return res.status(400).json({msg: 'Profile not found'});
}
res.status(500).send('Server Error');
}
});

// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async(req,res) =>{
    //populate profiles from user and get name and avatar
try {
    // @todo - remove users posts
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id})
    // Romove User 
    await Profile.findOneAndRemove({ _id: req.user.id})

    res.json({ msg: 'User deleted'})
} catch (err) {
console.error(err.message);
res.status(500).send('Server Error');
}
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'from date is required').not().isEmpty()
]], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
                                    // get errors from check which will be in array of errors
        return res.status(400).json({errors: errors.array()})
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    // Is destructured and is same as do title: title, company: company etc...
    // Create a object with data that user submits
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id});

        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) =>{
    try{
        const profile = await Profile.findOne({ user: req.user.id}); 

        // Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    }catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'fieldofstudy date is required').not().isEmpty(),
    check('from', 'from date is required').not().isEmpty()
]], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
                                    // get errors from check which will be in array of errors
        return res.status(400).json({errors: errors.array()})
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    // Is destructured and is same as do title: title, company: company etc...
    // Create a object with data that user submits
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id});

        profile.education.unshift(newEdu);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete('/education/:edu_id', auth, async (req, res) =>{
    try{
        const profile = await Profile.findOne({ user: req.user.id}); 

        // Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    }catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;