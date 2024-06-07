function submitHandler(evt) {
  const form = evt.target;
  const data = new FormData(form);

  fetch(form.action, {
    method: form.method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login: data.get("login"),
      pass: data.get("pass"),
    }),
  })
    .then((res) => {
      if (res.status === 200) {
        window.location.replace('dealer');
      }
      if (res.status === 401) {
        alert('Неверное имя пользователя или пароль!')
      }
    })
  evt.preventDefault();
}

document.addEventListener("submit", submitHandler);
