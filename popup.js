// Main logic script
// Handles the main function of the extension, meaning:
// - it calls the Duolingo API;
// - it selects the skill to practice;
// - it redirects the current tab to the practice page.


// Renders a string on the status field in the popup
function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

// Retrieves the username from the persistent settings
function getUsername(callback) {
    chrome.storage.sync.get(
        {username: ""}, // default to empty if not set
        function(items) {
            callback(items.username);
        }
    );
}

// Download the user's data from the Duolingo API
function getUserData(userName, callback, errorCallback) {

    if (!userName) {
        errorCallback("Please set your username in the settings page");
        return;
    }

    // We have a valid username, so we can hide the settings button
    document.getElementById("btnOptions").style.display = "none";

    var duoApiUrl = 'https://www.duolingo.com/api/1';
    var userUrl = duoApiUrl + '/users/show?username=' + userName;

    var req = new XMLHttpRequest();
    req.open('GET', userUrl);
    req.responseType = 'json';

    req.onload = function() {
        var response = req.response;
        if (!response) {
            errorCallback('No response from Duo :(');
        }
        else {
            callback(response);
        }
    };

    req.onerror = function() {
        errorCallback('Network error.');
    };
    req.send();
    renderStatus("Please wait...");
}

// Finds the skill with the lowest strength score
function findMinStrengthSkill(api_response) {
    var langData = api_response.language_data;
    if (!langData) {
        renderStatus("Could not get language data");
        return;
    }

    for (var lang in langData) {
        skills = langData[lang].skills;
        if (!skills) {
            renderStatus("Could not get skills for language " + lang);
            return;
        }

        // I assume there must be a better way, but I don't know JS at all, so...
        // TODO: replace with more idiomatic code
        var strength = Infinity;
        var result = null;
        for (var key in skills) {
            skill = skills[key];
            if (skill.learned && skill.strength <= strength) {
                result = skill;
                strength = skill.strength;
            }
        }

        return {language: lang, skill: result};
    }

}

// Redirects the browser to the training page for the selected skill
function goToTraining(result) {
    var url = "https://www.duolingo.com/skill/" + result.language + "/" + result.skill.url_title + "/practice";
    redirectTab(url);

    // We can close the extension's popup now
    window.close();
}

function redirectTab(new_url) {
    chrome.tabs.update(undefined, {url: new_url});
}


// Start immediately when the extension is opened (i.e, when the popup loads)
document.addEventListener('DOMContentLoaded', function() {

    document.getElementById("btnOptions").addEventListener("click", function() {
        chrome.runtime.openOptionsPage();
    });

    getUsername(
        function(username) {
            getUserData(username,
                function (response) {
                    var result = findMinStrengthSkill(response);
                    if (result) {
                        goToTraining(result);
                    }
                },
                renderStatus
            )
    })
});
