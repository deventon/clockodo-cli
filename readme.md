# Installing

```bash
npm install -g clock-cli
```

### Start clock

POST /v2/clock that will start a new entry with given customer/service/description.

### Stop clock

DELETE /v2/clock that will delete the running entry. Queries the endpoint before to get the running entry id.

### Start development on current branch

POST /v2/clock with customer set to "Entwicklung Main", service set to "Entwicklung" and description set to the current git branch name. Usable only in a git project.

### Session data / Login (api key)

Session data is stored in your home directory under .clock-cli/config.json.
To debug or log out, run clock-cli relog, this will delete the file.
