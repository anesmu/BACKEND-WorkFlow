const models = require("../models")
const Activity = models.db.activity

const addActivity = (data) => {
    let t
    const {type, bid, uid, cid, message} = data
    models.sequelize.transaction(transaction => {
        t = transaction
        return Activity.create({
            type,
            bid,
            cid,
            uid,
            message
        },{
            transaction: t
        })
    }).then(() => {
        console.log(":::: Successfully added activity ::::")
    })
    .catch((error) => {
        console.error(error.message)
        console.log.apply(":::: Failed to add activity ::::")
    })
}

module.exports = addActivity