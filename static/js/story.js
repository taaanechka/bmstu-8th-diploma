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

        // Заголовок с номером запроса
        let routeBoldDiv = document.createElement("div");
        routeBoldDiv.id = "reqh4-" + storyIndex;
        routeBoldDiv.className = "div-h4-req";
        let routeBold = document.createElement("h4");
        let routeText = document.createTextNode("Запрос №" + storyIndex);
        routeBold.appendChild(routeText);
        routeBoldDiv.appendChild(routeBold);
        tableDiv.appendChild(routeBoldDiv);

        // Включенные категории
        let incCategories = "";
        let incN = story_item.included_categories.length;
        story_item.included_categories.forEach(function (category) {
          incCategories += category + ", ";
        });
        incCategories = incCategories.substring(0, incCategories.length - 2); 
        let rowInc = document.createElement("tr");
        let cellIncName = document.createElement("td");
        cellIncName.appendChild(document.createTextNode("Включенные категории"));
        rowInc.appendChild(cellIncName);
        let cellInc = document.createElement("td");
        cellInc.appendChild(document.createTextNode(incCategories));
        rowInc.appendChild(cellInc);
        tblBody.appendChild(rowInc);

        // Исключенные категории
        let hardExCategories = "";
        story_item.hard_excluded_categories.forEach(function (category) {
          hardExCategories += category + ", ";
        });
        hardExCategories = hardExCategories.substring(0, hardExCategories.length - 2);
        let rowExHard = document.createElement("tr");
        let cellExHardName = document.createElement("td");
        cellExHardName.appendChild(document.createTextNode("Исключенные категории"));
        rowExHard.appendChild(cellExHardName);
        let cellExHard = document.createElement("td");
        cellExHard.appendChild(document.createTextNode(hardExCategories));
        rowExHard.appendChild(cellExHard);
        tblBody.appendChild(rowExHard);

        // Нежелательные категории
        let softExCategories = "";
        story_item.soft_excluded_categories.forEach(function (category) {
          softExCategories += category + ", ";
        });
        softExCategories = softExCategories.substring(0, softExCategories.length - 2);
        let rowExSoft = document.createElement("tr");
        let cellExSoftName = document.createElement("td");
        cellExSoftName.appendChild(document.createTextNode("Нежелательные категории"));
        rowExSoft.appendChild(cellExSoftName);
        let cellExSoft = document.createElement("td");
        cellExSoft.appendChild(document.createTextNode(softExCategories));
        rowExSoft.appendChild(cellExSoft);
        tblBody.appendChild(rowExSoft);

        // Начальная точка
        let rowStartPoint = document.createElement("tr");
        let cellStartPointName = document.createElement("td");
        cellStartPointName.appendChild(document.createTextNode("Начальная точка"));
        rowStartPoint.appendChild(cellStartPointName);
        let cellStartPoint = document.createElement("td");
        cellStartPoint.appendChild(document.createTextNode(story_item.start_point));
        rowStartPoint.appendChild(cellStartPoint);
        tblBody.appendChild(rowStartPoint);

        // Флаг использования предыдущей истории
        let prev_hist_val = story_item.use_prev_history ? "да" : "нет";
        let rowPrevHist = document.createElement("tr");
        let cellPrevHistName = document.createElement("td");
        cellPrevHistName.appendChild(document.createTextNode("Использовать предыдущую историю"));
        rowPrevHist.appendChild(cellPrevHistName);
        let cellPrevHist = document.createElement("td");
        cellPrevHist.appendChild(document.createTextNode(prev_hist_val));
        rowPrevHist.appendChild(cellPrevHist);
        tblBody.appendChild(rowPrevHist);

        // Флаг использования весов для редких категорий
        let uncom_w_val = story_item.use_common_weights ? "нет" : "да";
        let rowUncommonWeights = document.createElement("tr");
        let cellUncommonWeightsName = document.createElement("td");
        cellUncommonWeightsName.appendChild(document.createTextNode("Повысить приоритет мест из редких категорий"));
        rowUncommonWeights.appendChild(cellUncommonWeightsName);
        let cellUncommonWeights = document.createElement("td");
        cellUncommonWeights.appendChild(document.createTextNode(uncom_w_val));
        rowUncommonWeights.appendChild(cellUncommonWeights);
        tblBody.appendChild(rowUncommonWeights);

        // Флаг исключения объектов с низким рейтингом
        let ex_low_rang = story_item.exclude_low_rang_routes ? "да" : "нет";
        let rowExLowRang = document.createElement("tr");
        let cellExLowRangName = document.createElement("td");
        cellExLowRangName.appendChild(document.createTextNode("Исключить места с низким рейтингом (без рейтинга)"));
        rowExLowRang.appendChild(cellExLowRangName);
        let cellExLowRang = document.createElement("td");
        cellExLowRang.appendChild(document.createTextNode(ex_low_rang));
        rowExLowRang.appendChild(cellExLowRang);
        tblBody.appendChild(rowExLowRang);

        // Уровень активности отдыха
        let rowLvlActivity = document.createElement("tr");
        let cellLvlActivityName = document.createElement("td");
        cellLvlActivityName.appendChild(document.createTextNode("Уровень активности отдыха"));
        rowLvlActivity.appendChild(cellLvlActivityName);
        let cellLvlActivity = document.createElement("td");
        cellLvlActivity.appendChild(document.createTextNode(story_item.lvl_activity));
        rowLvlActivity.appendChild(cellLvlActivity);
        tblBody.appendChild(rowLvlActivity);

        // Уровень насыщенности пребывания
        let rowLvlSaruration = document.createElement("tr");
        let cellLvlSarurationName = document.createElement("td");
        cellLvlSarurationName.appendChild(document.createTextNode("Уровень насыщенности пребывания"));
        rowLvlSaruration.appendChild(cellLvlSarurationName);
        let cellLvlSaruration = document.createElement("td");
        cellLvlSaruration.appendChild(document.createTextNode(story_item.lvl_saturation_stay));
        rowLvlSaruration.appendChild(cellLvlSaruration);
        tblBody.appendChild(rowLvlSaruration);

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