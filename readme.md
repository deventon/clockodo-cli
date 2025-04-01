**Unofficial node based CLI tool for [Clockodo](https://www.clockodo.com)**

[![Version on NPM](https://img.shields.io/npm/v/clockodo-cli)](https://www.npmjs.com/package/clockodo-cli)
[![Semantically released](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Monthly downloads on NPM](https://img.shields.io/npm/dm/clockodo-cli)](https://www.npmjs.com/package/clockodo-cli)<br>

# Installation

```bash
npm install -g clockodo-cli
```

## Config and setup

You need to login to the application to generate and store an API key.
To use the Jira integration, you'll also have to enter your Jira login email and a Jira API key.

Core functionality of this tool requires you to set up default customers and services. You will be prompted to do so if necessary.

You can reset your config in the application if you need to. Better ways to do this will be implemented at a later time.

## Jira integration

If you have set up your Jira integration, you can start a clock based on your currently checked out Git branch. This will parse a jira ticket key, query the ticket name and use that as a description for your entry. There is some additional behaviour happening in the background:

- If your task is a sub task, it will use the parent
- If your task has a linked epic, it will query your clockodo projects for an exact name match. If there is no project, you can create one now by confirming.

## Meetings

You can use self defined presets as a shortcut to quickly book meetings. You can also quickly start booking a one-on-one meeting with a colleague by selecting one from your company.

## Editing an entry

This is very limited. You can change the currently running entry's data and extend an entry. For most cases you should use either the main application or the clock.
