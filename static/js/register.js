const registerForm = document.getElementById("register-form");
const registerButton = document.getElementById("register-form-submit");
const registerErrorMsg = document.getElementById("register-error-msg");

registerButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = registerForm.username.value;
    const password = registerForm.password.value;

    const request = new XMLHttpRequest();
    const url = "http://" + HOST + ":" + PORT + "/api/v1/register" + "?login=" + username + "&password=" + password;
    request.open("POST", url, true);
    request.responseType = "json";

    request.onload = function () {
        if (request.status !== 200) {
            console.log(request.response.error)
            registerErrorMsg.style.opacity = 1;
        } else {
            document.cookie = "jwt_token=" + request.response.token + "; path=/";
            document.cookie = "user_id=" + request.response.user_id + "; path=/";
            location.replace("http://" + HOST + ":" + PORT + "/route_builder");
        }
    }

    request.send();
})