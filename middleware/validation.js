const Joi = require('joi');

const allowedGenders = [
    'male',
    'female',
    'non-binary',
    'transgender',
    'other',
    'prefer not to say'
];

const userRegistrationSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstname: Joi.string().max(50).required(),
    lastname: Joi.string().max(50).required()
});

const profileUpdateSchema = Joi.object({
    // Genre unique sélectionné
    gender: Joi.string().valid(...allowedGenders).required(),

    // Préférences multiples autorisées (array non vide de labels valides)
    preferences: Joi.array()
        .items(Joi.string().valid(...allowedGenders))
        .min(1)
        .required(),

    birthdate: Joi.date().less('now').greater('1900-01-01').required(),

    bio: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    username: Joi.string().alphanum().min(3).max(50).required(),
    firstname: Joi.string().max(50).required(),
    lastname: Joi.string().max(50).required()
});

const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const messageSchema = Joi.object({
    receiver_id: Joi.number().integer().positive().required(),
    content: Joi.string().min(1).max(1000).required()
});

const validateRegistration = (req, res, next) => {
    const { error } = userRegistrationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const validateLogin = (req, res, next) => {
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const validateMessage = (req, res, next) => {
    const { error } = messageSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const validateProfileUpdate = (req, res, next) => {
    const { error } = profileUpdateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
    

module.exports = {
    validateRegistration,
    validateLogin,
    validateMessage,
    validateProfileUpdate
};
