let includeCategoriesCheckList = document.getElementById('include-categories-list');
includeCategoriesCheckList.getElementsByClassName('anchor')[0].onclick = function(evt) {
  if (includeCategoriesCheckList.classList.contains('visible'))
    includeCategoriesCheckList.classList.remove('visible');
  else
    includeCategoriesCheckList.classList.add('visible');
}

let hardExcludeCategoriesCheckList = document.getElementById('hard-exclude-categories-list');
hardExcludeCategoriesCheckList.getElementsByClassName('anchor')[0].onclick = function(evt) {
  if (hardExcludeCategoriesCheckList.classList.contains('visible'))
    hardExcludeCategoriesCheckList.classList.remove('visible');
  else
    hardExcludeCategoriesCheckList.classList.add('visible');
}

let softExcludeCategoriesCheckList = document.getElementById('soft-exclude-categories-list');
softExcludeCategoriesCheckList.getElementsByClassName('anchor')[0].onclick = function(evt) {
  if (softExcludeCategoriesCheckList.classList.contains('visible'))
    softExcludeCategoriesCheckList.classList.remove('visible');
  else
    softExcludeCategoriesCheckList.classList.add('visible');
}

let startHourSelect = document.querySelector('#start-hour');
let startMinuteSelect = document.querySelector('#start-minute');
let endHourSelect = document.querySelector('#end-hour');
let endMinuteSelect = document.querySelector('#end-minute');
let metroStationsDatalist = document.getElementById('metro-station-name');

function populateStartHours() {
  for(let i = 8; i <= 22; i++) {
    let option = document.createElement('option');
    option.textContent = i;
    startHourSelect.appendChild(option);
  }
}

function populateStartMinutes() {
  for(let i = 0; i <= 59; i++) {
    let option = document.createElement('option');
    option.textContent = (i < 10) ? ("0" + i) : i;
    startMinuteSelect.appendChild(option);
  }
}

function populateEndHours() {
  for(let i = 8; i <= 22; i++) {
    let option = document.createElement('option');
    option.textContent = i;
    endHourSelect.appendChild(option);
  }
}

function populateEndMinutes() {
  for(let i = 0; i <= 59; i++) {
    let option = document.createElement('option');
    option.textContent = (i < 10) ? ("0" + i) : i;
    endMinuteSelect.appendChild(option);
  }
}

function loadMetroStations() {
  const request = new XMLHttpRequest();
  const url = "http://" + HOST + ":" + PORT + "/api/v1/metro";
  request.open("GET", url, true);
  request.responseType = "json";

  request.onload = function () {
    if (request.status !== 200) {
      console.log("Some error while getting metro stations")
      console.log(request.response)
    } else {
      let metroStations = request.response.metro_stations
      metroStations.forEach(function (station) {
        let option = document.createElement('option');
        option.textContent = station;
        metroStationsDatalist.appendChild(option);
      });
    }
  }

  request.send();
}

function loadCategories() {
  const request = new XMLHttpRequest();
  const url = "http://" + HOST + ":" + PORT + "/api/v1/categories";
  request.open("GET", url, true);
  request.responseType = "json";

  request.onload = function () {
    if (request.status !== 200) {
      console.log("Some error while getting metro stations");
      console.log(request.response);
    } else {
      let categories = request.response.categories.sort()
      categories.forEach(function (category) {
        let items = [includeItems, softExcludeItems, hardExcludeItems];
        for (let i = 0; i < items.length; i++) {
          let li = document.createElement('li');
          let inputCheckbox = document.createElement('input');
          inputCheckbox.type = "checkbox";

          li.appendChild(inputCheckbox);
          li.appendChild(document.createTextNode(category));
          items[i].appendChild(li);
        }
      });
    }
  }

  request.send();
}

loadCategories();
populateStartHours();
populateStartMinutes();
populateEndHours();
populateEndMinutes();
loadMetroStations();

const getCookie = (name) => {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=')
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '')
}


const includeItems = document.getElementById("include-items");
const softExcludeItems = document.getElementById("soft-exclude-items");
const hardExcludeItems = document.getElementById("hard-exclude-items");

const usePrevHistoryInput = document.getElementById("use-prev-history");
const useUncommonWeightsInput = document.getElementById("use-uncommon-weights");
const excludeLowRangRoutesInput = document.getElementById("exclude-low-rang-routes");

const lvlSaturationStay = document.getElementById("lvl-saturation-stay");
const lvlActivity = document.getElementById("lvl-activity");

const metroStationInput = document.getElementById("metro-station-input");

const showStoryButton = document.getElementById("show-story-submit");
const buildRouteButton = document.getElementById("build-route-submit");

const routeTableList = document.getElementById("route-table-list");
let tableIndex = 0;
let routes = [];

function buildParams() {
  let params = "";

  let included_categories = "";
  let included = includeItems.getElementsByTagName("li");
  for (let i = 0; i < included.length; ++i) {
    if (included[i].firstChild.checked) {
      included_categories += included[i].lastChild.textContent;
      included_categories += ",";
    }
  }
  included_categories = included_categories.slice(0, -1);

  let soft_excluded_categories = "";
  let softExcluded = softExcludeItems.getElementsByTagName("li");
  for (let i = 0; i < softExcluded.length; ++i) {
    if (softExcluded[i].firstChild.checked) {
      soft_excluded_categories += softExcluded[i].lastChild.textContent;
      soft_excluded_categories += ",";
    }
  }
  soft_excluded_categories = soft_excluded_categories.slice(0, -1);

  let hard_excluded_categories = "";
  let hardExcluded = hardExcludeItems.getElementsByTagName("li");
  for (let i = 0; i < hardExcluded.length; ++i) {
    if (hardExcluded[i].firstChild.checked) {
      hard_excluded_categories += hardExcluded[i].lastChild.textContent;
      hard_excluded_categories += ",";
    }
  }
  hard_excluded_categories = hard_excluded_categories.slice(0, -1);

  const start_point = metroStationInput.value;
  const start_time = startHourSelect.value + ":" + startMinuteSelect.value;
  const end_time = endHourSelect.value + ":" + endMinuteSelect.value;
  const use_prev_history = usePrevHistoryInput.checked ? 1 : 0;
  const use_common_weights = useUncommonWeightsInput.checked ? 0 : 1;
  const exclude_low_rang_routes = excludeLowRangRoutesInput.checked ? 1 : 0;
  const lvl_saturation_stay = lvlSaturationStay.value;
  const lvl_activity = lvlActivity.value;

  params +=
      "included_categories=" + included_categories +
      "&soft_excluded_categories=" + soft_excluded_categories +
      "&hard_excluded_categories=" + hard_excluded_categories +
      "&start_point=" + start_point +
      "&start_time=" + start_time +
      "&end_time=" + end_time +
      "&use_prev_history=" + use_prev_history +
      "&use_common_weights=" + use_common_weights +
      "&exclude_low_rang_routes=" + exclude_low_rang_routes +
      "&lvl_saturation_stay=" + lvl_saturation_stay +
      "&lvl_activity=" + lvl_activity;

  return params
}

function buildDropDownSelect(list, parent, id) {
  let selectList = document.createElement("select");
  selectList.id = id;
  parent.appendChild(selectList);

  for (let i = 0; i < list.length; i++) {
    let option = document.createElement("option");
    option.value = list[i];
    option.text = list[i];
    selectList.appendChild(option);
  }
}

let tabs_links = document.getElementById("tabs_links");
let spinner = document.getElementById("spinner");

buildRouteButton.addEventListener("click", (e) => {
    e.preventDefault();
    clearTableList();

    buildRouteButton.disabled = true;
    spinner.classList.remove('submit-spinner_hide');
    console.log(buildRouteButton.disabled, spinner.classList);

    const request = new XMLHttpRequest();
    let user_id = getCookie("user_id");
    let token = getCookie("jwt_token");
    let params = buildParams();
    console.log(params);
    const url = "http://" + HOST + ":" + PORT + "/api/v1/user/" + user_id + "/route/recommend?" + params;

    request.responseType = "json";
    request.open("GET", url, true);
    request.setRequestHeader("Authorization", "Bearer " + token);

    tabs_links.innerHTML = null;

    request.onload = function () {
        if (request.status !== 200) {
            alert(request.response.error)
        } else {
          document.cookie = "rid=" + request.response.rid + "; path=/";

          let routesList = request.response.routes;
          routes = routesList;
          routesList.forEach(function (route) {
            let tableDiv = document.createElement("div");
            tableDiv.id = "route-" + tableIndex;
            tableDiv.className = "table-block";
            let tbl = document.createElement("table");
            tbl.className = "table-route";
            let tblBody = document.createElement("tbody");
            tblBody.className = "table-body-route";
            
            let routeBoldDiv = document.createElement("div");
            routeBoldDiv.id = "routeh3-" + tableIndex;
            routeBoldDiv.className = "div-h3-route";
            let routeBold = document.createElement("h3");
            let routeText = document.createTextNode("Маршрут №" + (Number(tableIndex) + Number(1)).toString());
            routeBold.appendChild(routeText);
            routeBoldDiv.appendChild(routeBold);
            tableDiv.appendChild(routeBoldDiv);

            let stepIndex = 1;
            route.forEach(function (route_step) {
              let step = route_step.step;
              let time = route_step.time;
              let row = document.createElement("tr");

              let cellRowIndex = document.createElement("td");
              let cellRowIndexText = document.createTextNode(stepIndex);
              cellRowIndex.appendChild(cellRowIndexText);
              row.appendChild(cellRowIndexText);

              let cellStep = document.createElement("td");
              let cellStepText = document.createTextNode(step);
              cellStep.appendChild(cellStepText);
              row.appendChild(cellStep);

              let cellTime = document.createElement("td");
              let cellTimeText = document.createTextNode(time);
              cellTime.appendChild(cellTimeText);
              row.appendChild(cellTime);

              tblBody.appendChild(row);
              stepIndex += 1;
            });
            tbl.appendChild(tblBody);
            tbl.setAttribute("border", "2");
            tableDiv.appendChild(tbl);

            let reviewBoldDiv = document.createElement("div");
            reviewBoldDiv.id = "reviewh3-" + tableIndex;
            reviewBoldDiv.innerHTML = "<h3>" + "Пожалуйста, оставьте отзыв о предложенном маршруте" + "</h3>";
            tableDiv.appendChild(reviewBoldDiv);

            let userTypeText = document.createTextNode("1. Выберите Ваш тип пользователя:");
            tableDiv.appendChild(userTypeText);
            let userTypeDiv = document.createElement("div");
            userTypeDiv.id = "user-type-div-" + tableIndex;
            userTypeDiv.className = "some-block";
            tableDiv.appendChild(userTypeDiv);
            buildDropDownSelect(
                ["Опытный: знаю много достопримечательностей и интересных мест в Москве",
                  "Новичок: знаю мало доостопримечательностей и интересных мест в Москве"],
                userTypeDiv,
                "user-type-" + tableIndex
            );

            let overallText = document.createTextNode("2. Выберете Вашу оценку маршрута:");
            tableDiv.appendChild(overallText);
            let overallDiv = document.createElement("div");
            overallDiv.id = "overall-div-" + tableIndex;
            overallDiv.className = "some-block";
            tableDiv.appendChild(overallDiv);
            buildDropDownSelect(["Положительно", "Нейтрально", "Отрицательно"], overallDiv, "overall-" + tableIndex);

            let generalText = document.createTextNode("3. Оцените соответствие маршрута Вашим ожиданиям:");
            tableDiv.appendChild(generalText);
            let generalDiv = document.createElement("div");
            generalDiv.id = "general-div-" + tableIndex;
            generalDiv.className = "some-block";
            tableDiv.appendChild(generalDiv);
            buildDropDownSelect(
                ["Соответствует ожиданиям, хорошо", "Соответствует ожиданиям, плохо",
                  "Не соответствует ожиданиям, хорошо", "Не соответствует ожиданиям, плохо"],
                generalDiv,
                "general-" + tableIndex
            );

            let someoneNewText = document.createTextNode("4. Нашли ли Вы для себя в маршруте что-то новое?");
            tableDiv.appendChild(someoneNewText);
            let someNewCheckboxDiv = document.createElement("div");
            someNewCheckboxDiv.id = "some-new-div-" + tableIndex;
            let someNewCheckbox = document.createElement('input');
            someNewCheckbox.type = "radio";
            someNewCheckbox.name = "seen";
            someNewCheckbox.id = "some-new-" + tableIndex;
            someNewCheckboxDiv.appendChild(someNewCheckbox);
            someNewCheckboxDiv.appendChild(document.createTextNode("Да"));
            tableDiv.appendChild(someNewCheckboxDiv);

            let seenBeforeCheckboxDiv = document.createElement("div");
            seenBeforeCheckboxDiv.id = "seen-before-div-" + tableIndex;
            seenBeforeCheckboxDiv.className = "some-block";
            let seenBeforeCheckbox = document.createElement('input');
            seenBeforeCheckbox.type = "radio";
            seenBeforeCheckbox.name = "seen";
            seenBeforeCheckbox.id = "seen-before-" + tableIndex;
            seenBeforeCheckboxDiv.appendChild(seenBeforeCheckbox);
            seenBeforeCheckboxDiv.appendChild(document.createTextNode("Нет, мной посещены все места из маршрута"));
            tableDiv.appendChild(seenBeforeCheckboxDiv)

            let feedbackTextareaDiv = document.createElement("div");
            feedbackTextareaDiv.id = "feedback-div-" + tableIndex;
            feedbackTextareaDiv.className = "some-block";
            let feedbackTextarea = document.createElement("textarea");
            feedbackTextarea.id = "feedback-" + tableIndex;
            feedbackTextarea.cols = 130;
            feedbackTextarea.rows = 5;
            tableDiv.appendChild(document.createTextNode("5. Здесь Вы можете оставить развернутый отзыв о маршруте:"));
            feedbackTextareaDiv.appendChild(feedbackTextarea);
            tableDiv.appendChild(feedbackTextareaDiv);

            let sendFeedbackSubmit = document.createElement("input");
            sendFeedbackSubmit.type = "submit";
            sendFeedbackSubmit.id = "send-feedback-" + tableIndex;
            sendFeedbackSubmit.value = "Отправить";
            sendFeedbackSubmit.className = "submit-review";
            sendFeedbackSubmit.addEventListener("click", sendFeedback);
            tableDiv.appendChild(sendFeedbackSubmit);

            routeTableList.appendChild(tableDiv);
            let a = document.createElement("a");
            a.href = "#" + tableDiv.id;
            a.id = "route-link-" + tableDiv.id;
            a.appendChild(routeText.cloneNode());
            // Подсвечивание фона ссылки на выбранный к просмотру маршрут
            a.addEventListener('click', (e) => {
              let url = e.target.href;
              // console.log("targetUrl: " + url);

              let tabs_el = tabs_links.getElementsByTagName('a');
              for (let i = 0; i < tabs_el.length; i++) {
                  // console.log(url + " | " + tabs_el[i].href);
                  if (url == tabs_el[i].href) {
                    tabs_el[i].className = "act-route-link";
                    console.log("Success: " + tabs_el[i].href);
                  }
                  else {
                    tabs_el[i].className = "";
                  }
                }
            });
            tabs_links.appendChild(a);
            tableIndex += 1;
          });
        }

        buildRouteButton.disabled = false;
        spinner.classList.add('submit-spinner_hide');
    }

    request.send();
})

function showRoute(e) {
  e.preventDefault();

  const parent = this.parentElement;
  const index = Number(parent.id.split('-')[1]);

  let route = document.getElementById("route-" + index);
  route.style.display = "";
}

function sendFeedback(e) {
  e.preventDefault();

  const parent = this.parentElement;
  const index = Number(parent.id.split('-')[1]);

  const request = new XMLHttpRequest();
  let user_id = getCookie("user_id");
  let rid = getCookie("rid");
  const url = "http://" + HOST + ":" + PORT + "/api/v1/user/" + user_id + "/route/feedback?rid=" + rid;

  const feedbackData = {
    "feedback": {
      "user_id": user_id,
      "rid": rid,
      "index": index,
      "route": routes[index],
      "user_type": document.getElementById("user-type-" + index).value,
      "overall": document.getElementById("overall-" + index).value,
      "general": document.getElementById("general-" + index).value,
      "some_new": document.getElementById("some-new-" + index).checked,
      "seen_before": document.getElementById("seen-before-" + index).checked,
      "feedback": document.getElementById("feedback-" + index).value
    }
  };

  request.open("POST", url, true);
  request.setRequestHeader('Content-type', 'application/json; charset=utf-8');
  request.send(JSON.stringify(feedbackData));

  alert("Отзыв отправлен");
}

function clearTableList() {
  while (routeTableList.firstChild) {
    routeTableList.removeChild(routeTableList.firstChild);
  }
  tableIndex = 0;
}

showStoryButton.addEventListener("click", () => {
  const url = "http://" + HOST + ":" + PORT + "/story";
  window.open(url, '_blank').focus();
})
