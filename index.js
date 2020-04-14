module.exports = (db, opts) => {
    const options = Object.assign({
        property: 'session',
        getSessionKey: (ctx) => {
            if (ctx.from && ctx.chat) {
                return `${ctx.from.id}/${ctx.chat.id}`
            } else if (ctx.from && ctx.inlineQuery) {
                return `${ctx.from.id}/${ctx.from.id}`
            }
            return null
        }
    }, opts)

    function getSession(key) {
        return new Promise(async(resolve, reject) => {
            try {
                let session = await getBotSessionByKey(db, key)
                if (session) {
                    resolve(JSON.parse(session.sessionValues))
                } else {
                    resolve(undefined)
                }
            } catch (err) {
                console.error('getSession', err)
                reject(err)
            }
        })
    }

    function saveSession (key, sessionValues) {
        return new Promise(async(resolve, reject) => {
            try {
                let session = await getBotSessionByKey(db, key)
                if ((!sessionValues || Object.keys(sessionValues).length === 0) && session) {
                    await db.delete(db.key(['BotSession', parseInt(session[db.KEY].id)]))
                } else if (session) {
                    session.sessionValues = JSON.stringify(sessionValues)
                    await db.update(session)
                } else {
                    if (sessionValues && Object.keys(sessionValues).length > 0) {
                        session = {
                            key: db.key('BotSession'),
                            data: [
                                {
                                    name: 'key',
                                    value: key,
                                    type: 'string'
                                },
                                {
                                    name: 'sessionValues',
                                    value: JSON.stringify(sessionValues),
                                    excludeFromIndexes: true,
                                    type: 'text'
                                }
                            ]
                        }
                        await db.upsert(session)
                    }
                }
                resolve()
            } catch (err) {
                console.error('saveSession', err)
                reject(err)
            }
        })
    }

    return (ctx, next) => {
        const key = options.getSessionKey(ctx)
        if (!key) {
            return next()
        }
        return getSession(key).then((value) => {
            let session = value || {}
            Object.defineProperty(ctx, options.property, {
                get: function () { return session },
                set: function (newValue) { session = Object.assign({}, newValue) }
            })
            return next().then(() => saveSession(key, session))
        })
    }
}

function getBotSessionByKey(db, key) {
    return new Promise(async(resolve, reject) => {
        try {
            const query    = await db.createQuery('BotSession').filter('key', '=', key)
            let [sessions] = await db.runQuery(query)
            if (sessions.length > 0) {
                resolve(sessions[0])
            } else {
                resolve(undefined)
            }
        } catch (err) {
            console.error('getBotSessionByKey', err)
            reject(err)
        }
    })
}