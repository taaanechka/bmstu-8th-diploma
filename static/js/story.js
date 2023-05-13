const storyListDivBlock = document.getElementById("story-list-block");

const getCookie = (name) => {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=')
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '')
}

function loadStory() {
  let user_id = getCookie("user_id");
  const request = new XMLHttpRequest();
  const url = "http://" + HOST + ":" + PORT + "/api/v1/story" + "?id=" + user_id;
  request.open("GET", url, true);
  request.responseType = "json";

  request.onload = function () {
    if (request.status !== 200) {
      console.log("Some error while getting metro stations");
      console.log(request.response);
    } else {
      let storyIndex = 1;
      let story = request.response.story;
      story.forEach(function (story_item) {
        storyListDivBlock.appendChild(document.createTextNode(storyIndex + "."))

        let includedCategories = "";
        let includedCategoriesDiv = document.createElement("div");
        includedCategoriesDiv.id = "included-categories-div-" + storyIndex;
        includedCategoriesDiv.className = "some-block";
        story_item.included_categories.forEach(function (category) {
          includedCategories += category + ", ";
        });
        includedCategories = includedCategories.substring(0, includedCategories.length - 2);
        includedCategoriesDiv.appendChild(document.createTextNode("Включенные категории: " + includedCategories));
        storyListDivBlock.appendChild(includedCategoriesDiv);

        let hardExcludedCategories = "";
        let hardExcludedCategoriesDiv = document.createElement("div");
        hardExcludedCategoriesDiv.id = "hard-excluded-categories-div-" + storyIndex;
        hardExcludedCategoriesDiv.className = "some-block";
        story_item.hard_excluded_categories.forEach(function (category) {
          hardExcludedCategories += category + ", ";
        });
        hardExcludedCategories = hardExcludedCategories.substring(0, hardExcludedCategories.length - 2);
        hardExcludedCategoriesDiv.appendChild(document.createTextNode("Исключенные категории: " + hardExcludedCategories));
        storyListDivBlock.appendChild(hardExcludedCategoriesDiv);

        let softExcludedCategories = "";
        let softExcludedCategoriesDiv = document.createElement("div");
        softExcludedCategoriesDiv.id = "soft-excluded-categories-div-" + storyIndex;
        softExcludedCategoriesDiv.className = "some-block";
        story_item.soft_excluded_categories.forEach(function (category) {
          softExcludedCategories += category + ", ";
        });
        softExcludedCategories = softExcludedCategories.substring(0, softExcludedCategories.length - 2);
        softExcludedCategoriesDiv.appendChild(document.createTextNode("Нежелательные категории: " + softExcludedCategories));
        storyListDivBlock.appendChild(softExcludedCategoriesDiv);

        let startPointDiv = document.createElement("div");
        startPointDiv.id = "start-point-div-" + storyIndex;
        startPointDiv.className = "some-block";
        startPointDiv.appendChild(document.createTextNode("Начальная точка: " + story_item.start_point));
        storyListDivBlock.appendChild(startPointDiv);

        let usePrevHistoryDiv = document.createElement("div");
        usePrevHistoryDiv.id = "use-prev-history-div-" + storyIndex;
        usePrevHistoryDiv.className = "some-block";
        if (story_item.use_prev_history) {
          usePrevHistoryDiv.appendChild(document.createTextNode("Использовать предыдущую историю: да"));
        } else {
          usePrevHistoryDiv.appendChild(document.createTextNode("Использовать предыдущую историю: нет"));
        }
        storyListDivBlock.appendChild(usePrevHistoryDiv);

        let useUncommonWeightsDiv = document.createElement("div");
        useUncommonWeightsDiv.id = "use-uncommon-weights-div-" + storyIndex;
        useUncommonWeightsDiv.className = "some-block";
        if (story_item.use_common_weights) {
          useUncommonWeightsDiv.appendChild(document.createTextNode("Показывать места из редких категорий: нет"));
        } else {
          useUncommonWeightsDiv.appendChild(document.createTextNode("Показывать места из редких категорий: да"));
        }
        storyListDivBlock.appendChild(useUncommonWeightsDiv);

        let excludeLowRangRoutesDiv = document.createElement("div");
        excludeLowRangRoutesDiv.id = "exclude-low-rang-routes-div-" + storyIndex;
        excludeLowRangRoutesDiv.className = "some-block";
        if (story_item.exclude_low_rang_routes) {
          excludeLowRangRoutesDiv.appendChild(document.createTextNode("Отбрасывать места с низким рейтингом или без рейтинга: да"));
        } else {
          excludeLowRangRoutesDiv.appendChild(document.createTextNode("Отбрасывать места с низким рейтингом или без рейтинга: нет"));
        }
        storyListDivBlock.appendChild(excludeLowRangRoutesDiv);

        storyIndex += 1;
      });
    }
  }

  request.send();
}

loadStory();