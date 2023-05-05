const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const loginErrorMsg = document.getElementById("login-error-msg");

loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    const request = new XMLHttpRequest();
    const url = "http://" + HOST + ":" + PORT + "/api/login?login=" + username + "&password=" + password;
    request.open("GET", url, true);
    request.responseType = "json";

    request.onload = function () {
        if (request.status !== 200) {
            console.log(request.response.error)
            loginErrorMsg.style.opacity = 1;
        } else {
            document.cookie = "jwt_token=" + request.response.token + "; path=/";
            document.cookie = "user_id=" + request.response.user_id + "; path=/";
            location.replace("http://" + HOST + ":" + PORT + "/route_builder");
        }
    }

    request.send();
})