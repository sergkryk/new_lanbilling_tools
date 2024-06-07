const fio = document.querySelector("#fio").textContent;
const address = document.querySelector("#address").textContent;

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
      // uid: data.get("uid"),
      agrmid: data.get("agrmid"),
      // account: data.get("account"),
      sum: data.get("sum"),
      // address,
      phone: data.get("phone"),
      // fio,
    }),
  })
  .then((res) => res.text())
  .then((text) => new DOMParser().parseFromString(text, "text/html"))
  .then((doc) => {
    const result = document.createElement("div");
    result.innerHTML = doc.body.innerHTML;
    form.parentNode.innerHTML = result.innerHTML;
  })
  .catch((err) => {
    const result = document.createElement("p");
    result.textContent = "Не удалось завершить операцию!!!";
    form.parentNode.innerHTML = result.innerHTML;
  });
  
  evt.preventDefault();
}

document.addEventListener("submit", submitHandler);