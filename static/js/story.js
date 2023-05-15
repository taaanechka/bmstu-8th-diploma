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
      let story = request.response.story.reverse();
      let storyIndex = story.length;
      story.forEach(function (story_item) {
        // Таблица данных запроса с индексом storyIndex
        let tableDiv = document.createElement("div");
        tableDiv.id = "request-" + storyIndex;
        tableDiv.className = "table-block";
        let tbl = document.createElement("table");
        tbl.className = "table-route";
        let tblBody = document.createElement("tbody");
        tblBody.className = "table-body-route";

        let routeBoldDiv = document.createElement("div");
        routeBoldDiv.id = "reqh4-" + storyIndex;
        routeBoldDiv.className = "div-h4-req";
        let routeBold = document.createElement("h4");
        let routeText = document.createTextNode("Запрос №" + storyIndex);
        routeBold.appendChild(routeText);
        routeBoldDiv.appendChild(routeBold);
        tableDiv.appendChild(routeBoldDiv);
        // storyListDivBlock.appendChild(document.createTextNode(storyIndex + "."));

        let incCategories = "";
        // let incCategoriesDiv = document.createElement("div");
        // incCategoriesDiv.id = "included-categories-div-" + storyIndex;
        // incCategoriesDiv.className = "some-block";
        let incN = story_item.included_categories.length;
        story_item.included_categories.forEach(function (category) {
          incCategories += category + ", ";
        });
        incCategories = incCategories.substring(0, incCategories.length - 2); // : "все категории";
        
        // incCategoriesDiv.appendChild(document.createTextNode("Включенные категории: " + incCategories));
        // storyListDivBlock.appendChild(incCategoriesDiv);
        let rowInc = document.createElement("tr");
        let cellIncName = document.createElement("td");
        cellIncName.appendChild(document.createTextNode("Включенные категории"));
        rowInc.appendChild(cellIncName);
        let cellInc = document.createElement("td");
        cellInc.appendChild(document.createTextNode(incCategories));
        rowInc.appendChild(cellInc);
        tblBody.appendChild(rowInc);

        let hardExCategories = "";
        // let hardExCategoriesDiv = document.createElement("div");
        // hardExCategoriesDiv.id = "hard-excluded-categories-div-" + storyIndex;
        // hardExCategoriesDiv.className = "some-block";
        story_item.hard_excluded_categories.forEach(function (category) {
          hardExCategories += category + ", ";
        });
        hardExCategories = hardExCategories.substring(0, hardExCategories.length - 2);
        // hardExCategoriesDiv.appendChild(document.createTextNode("Исключенные категории: " + hardExCategories));
        // storyListDivBlock.appendChild(hardExCategoriesDiv);
        let rowExHard = document.createElement("tr");
        let cellExHardName = document.createElement("td");
        cellExHardName.appendChild(document.createTextNode("Исключенные категории"));
        rowExHard.appendChild(cellExHardName);
        let cellExHard = document.createElement("td");
        cellExHard.appendChild(document.createTextNode(hardExCategories));
        rowExHard.appendChild(cellExHard);
        tblBody.appendChild(rowExHard);

        let softExCategories = "";
        // let softExCategoriesDiv = document.createElement("div");
        // softExCategoriesDiv.id = "soft-excluded-categories-div-" + storyIndex;
        // softExCategoriesDiv.className = "some-block";
        story_item.soft_excluded_categories.forEach(function (category) {
          softExCategories += category + ", ";
        });
        softExCategories = softExCategories.substring(0, softExCategories.length - 2);
        // softExCategoriesDiv.appendChild(document.createTextNode("Нежелательные категории: " + softExCategories));
        // storyListDivBlock.appendChild(softExCategoriesDiv);
        let rowExSoft = document.createElement("tr");
        let cellExSoftName = document.createElement("td");
        cellExSoftName.appendChild(document.createTextNode("Нежелательные категории"));
        rowExSoft.appendChild(cellExSoftName);
        let cellExSoft = document.createElement("td");
        cellExSoft.appendChild(document.createTextNode(softExCategories));
        rowExSoft.appendChild(cellExSoft);
        tblBody.appendChild(rowExSoft);

        // let startPointDiv = document.createElement("div");
        // startPointDiv.id = "start-point-div-" + storyIndex;
        // startPointDiv.className = "some-block";
        // startPointDiv.appendChild(document.createTextNode("Начальная точка: " + story_item.start_point));
        // storyListDivBlock.appendChild(startPointDiv);
        let rowStartPoint = document.createElement("tr");
        let cellStartPointName = document.createElement("td");
        cellStartPointName.appendChild(document.createTextNode("Начальная точка"));
        rowStartPoint.appendChild(cellStartPointName);
        let cellStartPoint = document.createElement("td");
        cellStartPoint.appendChild(document.createTextNode(story_item.start_point));
        rowStartPoint.appendChild(cellStartPoint);
        tblBody.appendChild(rowStartPoint);

        // let usePrevHistoryDiv = document.createElement("div");
        // usePrevHistoryDiv.id = "use-prev-history-div-" + storyIndex;
        // usePrevHistoryDiv.className = "some-block";
        let prev_hist_val = story_item.use_prev_history ? "да" : "нет";
        // if (story_item.use_prev_history) {
        //   prev_hist_val += "да"
        //   // usePrevHistoryDiv.appendChild(document.createTextNode("Использовать предыдущую историю: да"));
        // } else {
        //   prev_hist_val += "нет"
        //   // usePrevHistoryDiv.appendChild(document.createTextNode("Использовать предыдущую историю: нет"));
        // }
        // storyListDivBlock.appendChild(usePrevHistoryDiv);
        let rowPrevHist = document.createElement("tr");
        let cellPrevHistName = document.createElement("td");
        cellPrevHistName.appendChild(document.createTextNode("Использовать предыдущую историю"));
        rowPrevHist.appendChild(cellPrevHistName);
        let cellPrevHist = document.createElement("td");
        cellPrevHist.appendChild(document.createTextNode(prev_hist_val));
        rowPrevHist.appendChild(cellPrevHist);
        tblBody.appendChild(rowPrevHist);

        // let useUncommonWeightsDiv = document.createElement("div");
        // useUncommonWeightsDiv.id = "use-uncommon-weights-div-" + storyIndex;
        // useUncommonWeightsDiv.className = "some-block";
        let uncom_w_val = story_item.use_common_weights ? "нет" : "да";
        // if (story_item.use_common_weights) {
        //   useUncommonWeightsDiv.appendChild(document.createTextNode("Повысить приоритет мест из редких категорий: нет"));
        // } else {
        //   useUncommonWeightsDiv.appendChild(document.createTextNode("Повысить приоритет мест из редких категорий: да"));
        // }
        // storyListDivBlock.appendChild(useUncommonWeightsDiv);
        let rowUncommonWeights = document.createElement("tr");
        let cellUncommonWeightsName = document.createElement("td");
        cellUncommonWeightsName.appendChild(document.createTextNode("Повысить приоритет мест из редких категорий"));
        rowUncommonWeights.appendChild(cellUncommonWeightsName);
        let cellUncommonWeights = document.createElement("td");
        cellUncommonWeights.appendChild(document.createTextNode(uncom_w_val));
        rowUncommonWeights.appendChild(cellUncommonWeights);
        tblBody.appendChild(rowUncommonWeights);

        // let excludeLowRangRoutesDiv = document.createElement("div");
        // excludeLowRangRoutesDiv.id = "exclude-low-rang-routes-div-" + storyIndex;
        // excludeLowRangRoutesDiv.className = "some-block";
        let ex_low_rang = story_item.exclude_low_rang_routes ? "да" : "нет";
        // if (story_item.exclude_low_rang_routes) {
        //   excludeLowRangRoutesDiv.appendChild(document.createTextNode("Исключить места с низким рейтингом (без рейтинга): да"));
        // } else {
        //   excludeLowRangRoutesDiv.appendChild(document.createTextNode("Исключить места с низким рейтингом (без рейтинга): нет"));
        // }
        // storyListDivBlock.appendChild(excludeLowRangRoutesDiv);
        let rowExLowRang = document.createElement("tr");
        let cellExLowRangName = document.createElement("td");
        cellExLowRangName.appendChild(document.createTextNode("Исключить места с низким рейтингом (без рейтинга)"));
        rowExLowRang.appendChild(cellExLowRangName);
        let cellExLowRang = document.createElement("td");
        cellExLowRang.appendChild(document.createTextNode(ex_low_rang));
        rowExLowRang.appendChild(cellExLowRang);
        tblBody.appendChild(rowExLowRang);

        tbl.appendChild(tblBody);
        tbl.setAttribute("border", "2");
        tableDiv.appendChild(tbl);

        storyListDivBlock.appendChild(tableDiv);

        storyIndex--;
      });
    }
  }

  request.send();
}

loadStory();