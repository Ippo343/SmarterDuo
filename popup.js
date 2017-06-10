function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function getUserData(userName, callback, errorCallback) {
  var duoApiUrl = 'https://www.duolingo.com/api/1';
  var userUrl = duoApiUrl + '/users/show?username=' + userName;

  var req = new XMLHttpRequest();
  req.open('GET', userUrl);
  req.responseType = 'json';
  req.onload = function() {
    var response = req.response;
    if (!response) {
      errorCallback('No response from Duo :(');
      return;
    }
    callback(response);
  };
  req.onerror = function() {
    errorCallback('Network error.');
  };
  req.send();
  renderStatus("Please wait...");
}

function findMinStrengthSkill(request) {
    var langData = request.language_data;
    if (!langData) {
        renderStatus("Could not get language data");
        return;
    }

    for (var lang in langData) {
        renderStatus("Language: " + lang);
        skills = langData[lang].skills;
        if (!skills) {
            renderStatus("Could not get skills for language " + lang);
            return;
        }
        else {
            renderStatus("Skills ok");
        }

        var strength = Infinity;
        var result = null;
        for (var key in skills) {
            skill = skills[key];
            if (skill.strength > 0 && skill.strength < strength) {
                result = skill;
                strength = skill.strength;
            }
        }

        renderStatus("Chosen skill: " + result.title);

        return {language: lang, skill: result};
    }

}

function goToTraining(result) {
    var url = "https://www.duolingo.com/skill/" + result.language + "/" + result.skill.url_title + "/practice";
    renderStatus(url);
    redirectTab(url);
}

function redirectTab(new_url) {
    chrome.tabs.update(undefined, {url: new_url});
}

document.addEventListener('DOMContentLoaded', function() {
    getUserData("Ippo343",
    function (response) {
        var result = findMinStrengthSkill(response);
        if (result) {
            goToTraining(result);
        }
    },
    renderStatus
    )
});
