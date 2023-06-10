const models = require('../../models')
const User = models.db.user
const Board = models.db.board
const List = models.db.list
const Card = models.db.card
const Member = models.db.member
const Comment = models.db.comment
const Activity = models.db.activity
const ErrorHandler = require('../../middlewares/error').ErrorHandler
const getActivity = require('../../middlewares/activity')
const sequelize = require('sequelize')
const Op = sequelize.Op;

const getCardDetail = (req, res) => {
    let t
    const {cid} = req.params
    const decoded = req.decoded

    const memberCheck = (card) => {
        if(!card) {
            throw new Error("NOTFOUND")
        } else {
            return Member.findOne({
                where: {
                    bid: card.list.bid,
                    uid: decoded.uid
                },
                transaction: t
            })
        }
    }

    const getCard = (member) => {
        if(!member) {
            throw new Error("FORBIDDEN")
        } else {
            return Card.findOne({
                where: {
                    cid
                },
                transaction: t
            })
        }
    }

    const respond = (card) => {
        res.json({
            result: true,
            data: card
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return Card.findOne({
            where : {
                cid
            },
            include: [{
                model: List,
            }],
            transaction: t
        }).then(memberCheck)
        .then(getCard)
    }).then(respond)
    .catch(onError)
}

const getActivityByCard = (req, res) => {
    let t
    const {cid} = req.params
    const decoded = req.decoded

    const memberCheck = (card) => {
        if(!card) {
            throw new Error("NOTFOUND")
        } else {
            return Member.findOne({
                where: {
                    bid: card.list.bid,
                    uid: decoded.uid
                },
                transaction: t
            })
        }
    }

    const getActivity = (member) => {
        if(!member) {
            throw new Error("FORBIDDEN")
        } else {
            return Activity.findAll({
                where: {
                    cid
                },
                order: [
                    ['created_at', "DESC"]
                ],
                include: [{
                    model: User,
                    attributes: ['username', 'photo', 'email']
                },{
                    model: Board,
                    attributes: ['title']
                }],
                transaction: t
            })
        }
    }

    const respond = (activity) => {
        if(activity.length == 0){
            res.status(204).send()
        }else {
            res.json({
                result: true,
                data: activity
            })
        }
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return Card.findOne({
            where : {
                cid
            },
            include: [{
                model: List,
            }],
            transaction: t
        }).then(memberCheck)
        .then(getActivity)
    }).then(respond)
    .catch(onError)
}

const getCommentByCard = (req, res) => {
    let t
    const {cid} = req.params
    const decoded = req.decoded

    const memberCheck = (card) => {
        if(!card) {
            throw new Error("NOTFOUND")
        } else {
            return Member.findOne({
                where: {
                    bid: card.list.bid,
                    uid: decoded.uid
                },
                transaction: t
            })
        }
    }

    const getComment = (member) => {
        if(!member) {
            throw new Error("FORBIDDEN")
        } else {
            return Comment.findAll({
                where: {
                    cid
                },
                order: [
                    ['created_at', "DESC"]
                ],
                include: [{
                    model: User,
                    attributes: ['username', 'photo', 'email']
                }],
                transaction: t
            })
        }
    }

    const respond = (comment) => {
        if(comment.length == 0){
            res.status(204).send()
        }else {
            res.json({
                result: true,
                data: comment
            })
        }
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return Card.findOne({
            where : {
                cid
            },
            include: [{
                model: List,
            }],
            transaction: t
        }).then(memberCheck)
        .then(getComment)
    }).then(respond)
    .catch(onError)
}

const addCard = (req, res) => {
    let t
    const decoded = req.decoded
    const {title, lid, description} = req.body
    let list_title, bid = ""

    const listCheck = (list) => {
        if(!list) {
            throw new Error("NOTFOUND")
        } else {
            list_title = list.title
            bid = list.board.bid
            return Member.findOne({
                where: {
                    bid: list.bid,
                    uid: decoded.uid
                },
                transaction: t
            })
        }
    }

    const getMaxPosition = () => {
        return Card.max('position', {
            where: {
                lid
            },
            transaction: t
        });
    }

    const memberCheck = (member) => {
        if(!member) {
            throw new Error("FORBIDDEN")
        } else {
            return getMaxPosition().then(maxPosition => {
                let position = (maxPosition === null) ? 0 : maxPosition + 1;

                return Card.create({
                    title,
                    lid,
                    description,
                    position
                },{
                    transaction: t
                })
            })
        }
    }

    const respond = (card) => {
        const {cid, position} = card.dataValues
        res.json({
            result: true,
            message: "Successfully added a card.",
            data: {
                cid,
                lid,
                title,
                description,
                position
            }
        })
        return {
            type: "add",
            bid,
            uid: decoded.uid,
            message: `<span class="username">${decoded.username}</span> added ${title} to ${list_title}`
        }
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        if (title === undefined || title === null) {
            throw new Error("BADREQ")
        } else {
            return List.findOne({
                transaction: t,
                where: {
                    lid
                },
                include: [{model: Board}]
            }).then(listCheck)
            .then(memberCheck)
        }
    }).then(respond)
    .then(getActivity)
    .catch(onError)
}

const updateCard = (req, res) => {
    let t
    const decoded = req.decoded
    const {cid} = req.params
    const {title, description} = req.body

    const memberCheck = (card) => {
        if(!card) {
            throw new Error("NOTFOUND")
        } else {
            return Member.findOne({
                where: {
                    bid: card.list.bid,
                    uid: decoded.uid
                },
                transaction: t
            })
        }
    }

    const update = (member) => {
        if(!member) {
            throw new Error("FORBIDDEN")
        } else {
            return Card.update({
                title,
                description
            },{
                where: {
                    cid
                },
                transaction: t
            })
        }
    }

    const respond = () => {
        res.json({
            result: true,
            message: "The card has been successfully updated."
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return Card.findOne({
            where : {
                cid
            },
            include: [{
                model: List,
            }],
            transaction: t
        }).then(memberCheck)
        .then(update)
    }).then(respond)
    .catch(onError)
}

const deleteCard = (req, res) => {
    let t
    const decoded = req.decoded
    const {cid} = req.params

    const memberCheck = (card) => {
        if(!card) {
            throw new Error("NOTFOUND")
        } else {
            return Member.findOne({
                where: {
                    uid: decoded.uid,
                    bid: card.list.bid
                },
                transaction: t
            })
        }
    }

    const remove = (member) => {
        if(!member) {
            throw new Error("FORBIDDEN")
        } else {
            return Card.destroy({
                where: {
                    cid
                },
                transaction: t
            })
        }
    }

    const respond = () => {
        res.json({
            result: true,
            message: "The card has been successfully deleted."
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return Card.findOne({
            where: {
                cid
            },
            include: [{
                model: List
            }],
            transaction: t
        }).then(memberCheck)
        .then(remove)
    }).then(respond)
    .catch(onError)
}

const moveCard = async (req, res) => {
    const { cid } = req.params;
    const { lid, position } = req.body;
    const decoded = req.decoded;

    try {
        const t = await models.sequelize.transaction();

        const card = await Card.findOne({
            where: { cid },
            include: [{ model: List }],
            transaction: t
        });

        if (!card) throw new Error('NOTFOUND');

        const member = await Member.findOne({
            where: { uid: decoded.uid, bid: card.list.bid },
            transaction: t
        });

        if (!member) throw new Error('FORBIDDEN');

        const targetList = await List.findOne({
            where: { lid },
            transaction: t
        });

        if (!targetList) throw new Error('NOTFOUND');

        const cardsInTargetList = await Card.findAll({
            where: { lid },
            order: [['position', 'ASC']],
            transaction: t
        });

        if (card.lid !== lid) {
            const cardsInOldList = await Card.findAll({
                where: { lid: card.lid },
                order: [['position', 'ASC']],
                transaction: t
            });

            let oldPositions = cardsInOldList.filter(c => c.cid !== card.cid).map((c, i) => ({ cid: c.cid, position: i }));
            await Promise.all(oldPositions.map(pos => Card.update({ position: pos.position }, { where: { cid: pos.cid }, transaction: t })));
            
            let newPositions = cardsInTargetList.map((c, i) => {
                return { cid: c.cid, position: i >= position ? i + 1 : i };
            });
            await Promise.all(newPositions.map(pos => Card.update({ position: pos.position, lid }, { where: { cid: pos.cid }, transaction: t })));

            await Card.update({ position: position, lid }, { where: { cid: card.cid }, transaction: t });
        } else {
            let newPositions = [...cardsInTargetList]; 

            newPositions.splice(card.position, 1);
            newPositions.splice(position, 0, card); 

            for (let i = 0; i < newPositions.length; i++) {
                await Card.update({ position: i, lid }, { where: { cid: newPositions[i].cid }, transaction: t });
            }
        }

        await t.commit();

        res.json({ result: true, message: "Successfully moved the card." });
    } catch (error) {
        if (t) await t.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCardDetail,
    getActivityByCard,
    getCommentByCard,
    addCard,
    updateCard,
    deleteCard,
    moveCard
}