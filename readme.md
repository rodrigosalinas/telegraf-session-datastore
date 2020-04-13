[![Build Status](https://travis-ci.com/rodrigosalinas/telegraf-session-datastore.svg?branch=master)](https://travis-ci.com/github/rodrigosalinas/telegraf-session-datastore)
[![NPM Version](https://img.shields.io/npm/v/telegraf-session-datastore.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-datastore)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

# Datastore session for Telegraf

[Cloud Datastore](https://cloud.google.com/datastore) powered session middleware for [Telegraf](https://github.com/telegraf/telegraf).

## Installation

```js

$ npm install telegraf-session-datastore

```

## Example

```js
const Telegraf = require('telegraf')
const datastoreSession = require('telegraf-session-datastore')
const { Datastore } = require('@google-cloud/datastore')

const db = new Datastore({
    projectId:   process.env.PROJECT_ID,
    keyFilename: process.env.KEY_FILENAME
})

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(datastoreSession(db))
bot.on('text', (ctx, next) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return next()
})
bot.hears('/stats', ({ reply, session, from }) => reply(`${session.counter} messages from ${from.username}`))
bot.startPolling()

```

## API

### Options

* `property`: context property name (default: `session`)
* `getSessionKey`: session key resolver function (default: `(ctx) => any`)

Default implementation of `getSessionKey`:

```js
function getSessionKey(ctx) {
  if (!ctx.from || !ctx.chat) {
    return
  }
  return `${ctx.from.id}/${ctx.chat.id}`
}
```

### Destroying a session

To destroy a session simply set it to `null`.

```js
bot.on('text', (ctx) => {
  ctx.session = null
})

```
