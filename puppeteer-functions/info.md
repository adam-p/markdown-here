# How to use Puppeteer tasks in Azure Functions

## Table of Contents
**[Description](#Description)**<br>
**[Add new tasks](#Add-new-tasks)**<br>
**[Test Azure Function App local](#Test-Azure-Function-App-local)**<br>
**[Deploy to Azure Function App](#Deploy-to-Azure-Function-App)**<br>

## Description

## Add new tasks

New tasks (puppeteer scripts) will be implemented in the GitHub repository "puppeteer-task-runner".

### Implement task

New tasks have to be implemented in the GitHub repository "puppeteer-task-runner" in the folder "src/tasks". The "config" function usually just stores the config data in the variable "taskConfig". The config data contains an url, an username and a password. Futher informations are in the next chapter("config.json"). The real puppeteer action will happen in the "run funciton". This function gets the "templates" array of "config.json"

The task has to be implemented in the style of the following template:

```
const puppeteer = require("puppeteer");

let taskConfig = null;
const config = (config) => {
    taskConfig = config;
};

const run = async (data) => {#
    // add puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--start-maximized",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--no-sandbox"
        ]
    });
    const page = await browser.newPage();

    await page.setViewport({
        width: 1566,
        height: 768
    });

    await page.goto(taskConfig.logonUrl);
};

module.exports = {
    config: config,
    run: run
};
```

### config.json

The "config.json" file is used to test the implemented task in "test.js". The task to be executed must be stored in "task". The config data like url, username and password must be stored in "config". Data you want to use in the puppeteer script must be stored in "templates: []" where every array entery needs a "template_id" and a "template_body". Don't change the name conventions.

The config.json should look like:

```
{
    "task": "taskToRun",
    "config": {
        "logonUrl": "https://www.google.com",
        "userName": "MustermannMax",
        "password": "Maxxxi"
    },
    "templates": [
        {
            "template_id": "data1_id",
            "template_body": "data1_body"
        },
        {
            "template_id": "data2_id",
            "template_body": "data2_body"
        }
    ]
}
```

### Test your task

To test your task you can implement a junit test in "test.js". The test can be implmented like: 

```
const puppeteerRunner = require("./../index");
jest.setTimeout(500000);

test("runs taskToRun", async () => {
    const options = require("./config.json");
    const myTask = puppeteerRunner.create(options.config);

    const response = await myTask.run(options.task, options.templates);
    expect(response[0].status).toEqual("ok");
});
```

### Return data

In "index.js" your task will be prepared to run. Here un can modify the data to be returned "dataToReturn". Data that returns the "run" funciton of your task will be returned form the function "taskModule.run(data)".

### Publish puppeteer-task-runner

```
git add .
git commit -m "..."
npm version <next version number>
npm publish
```

### Install new puppeteer-task-runner in azure function

To use the new task in the azure funciton you have to update "puppeteer-task-runner" in the "azure-puppeteer-runner" GitHub repository. You can do this with the following steps:

1. Open the "azure-puppeteer-runner" GitHub repository
2. Open "package,json"
3. Enter your version number in "@tts-tmc/puppeteer-task-runner"
4. Run `npm install`

## Test Azure Function App local

To test a task localy on your computer you have do the following steps:

1. **[Add "GITHUB_ACCESS_TOKEN" in your system variables](#Add-"GITHUB_ACCESS_TOKEN"-in-your-system-variables)**<br>
2. **[Create http-Request](#Create-http-Request)**<br>
3. **[Run azure function app](#Run-azure-function-app)**<br>

### Add "GITHUB_ACCESS_TOKEN" in your system variables

The first time you do this you have to add a "GITHUB_ACCESS_TOKEN" to your system variables. You can do this following these steps:

1. Login to https://github.com/
2. Go to Settings -> Developer settings -> Personal access tokens -> Generate new token
3. Generate a new personal access token with an tick on "read:packages"
4. Copy the created key
5. Open your "Systemsteuerung" and go to "Umgebungsvariablen für dieses Konto bearbeiten"
6. Create a new "Benutzervariable" with the name "GITHUB_ACCESS_TOKEN" and for the value you use the generated personal access token key

### Create http-Request

To create a http-Request open "test.http" in the "azure-puppeteer-runner" GitHub repository. To create a http-Request use the following template. The stuff in the curly brackets is the same like in the config.json file of chapter "Add new tasks" -> "config.json". "PuppeteerOrchestrator" is the orchestrator of your azure function app you want to use. To send a request you have to click on "Send Request"

```
###
Send Request
POST http://localhost:7071/api/orchestrators/PuppeteerOrchestrator HTTP/1.1
Content-Type: application/json

{
    "task": "taskToRun",
    "config": {
        "logonUrl": "https://www.google.com",
        "userName": "MustermannMax",
        "password": "Maxxxi"
    },
    "templates": [
        {
            "template_id": "data1_id",
            "template_body": "data1_body"
        },
        {
            "template_id": "data2_id",
            "template_body": "data2_body"
        }
    ]
}
###
```

### Run azure function app

To start your azure function app locally you have to run the following commands in the dir of "azure-puppeteer-runner":

1. `npm install`
2. `npm run start`

To test your task you have to send a request to your app. You can do this by following these steps:

1. Click "Send Request" in "test.html" where the url starts with "http://localhost:7071"
2. Click on the first link that appears in the new window
3. Refresh the page till the status shows that the task is completed

## Deploy to Azure Function App

To deploy the modified "azure-puppeteer-runner" repository to the Azure Function App you have to follow these steps: 

1. Open "azure-puppeteer-runner" in visual studio code
2. Go to your Azure extension
3. Open the "FUNCTIONS" dropdown
4. Click on "Deploy to function app ..." which appears as an upload-icon when hovering over the "FUNCTIONS" dorpdown
5. Select "tts labs"
6. Select the right azure function app or **[create a new one](#Create-a-new-azure-function-app)**<br>

### Deploy a new azure function app

In the following chapter i will explain how to deploy on a new azure function app.

1. Open "azure-puppeteer-runner" in visual studio code
2. Go to your Azure extension
3. Open the "FUNCTIONS" dropdown
4. Click on "Deploy to function app ..." which appears as an upload-icon when hovering over the "FUNCTIONS" dorpdown
5. Select "tts labs"
6. Select "Create an new Function App in Azure... Advanced"
7. Enter a name
8. Select "Node.js 14LTS"
9. Select "Linux"
10. Select "App Service Plan"
11. Select or create an App Service Plan with Pricing tear "B1" and Resource group "puppeteer-runner-rg"
12. Select a storage account
13. Select "puppeteer-runner-fa"