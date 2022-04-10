// TODO: Clean & refactor
// TODO: Add comments

function setVisibility(element) {
  if (
    !element.style.display
    || element.style.display === "none"
  ) {
    element.style.display = "block";
  } else {
    element.style.display = "none";
  }
}

function showTip(evt) {
  const roundingInfoDiv = document.querySelector(".round-info");
  const truncateInfoDiv = document.querySelector(".truncate-info");
  const iconClassName = evt.target.classList[0];

  if (iconClassName === "round-icon") {
    setVisibility(roundingInfoDiv);
  } else {
    setVisibility(truncateInfoDiv);
  }
}

function throwError(message) {
  throw new Error(message);
}

function getFormData() {
  const index = document.querySelector("#index-select").value;
  const rounding = Array.from(
    document.querySelectorAll("input[name='rounding']")
  ).filter(input => input["checked"])[0];
  const risk = Number(
    document.querySelector("#risk-input").value
  );
  const accountSize = Number(
    document.querySelector("#account-size-input").value
  );
  const sl = Math.abs(Number(
    document.querySelector("#stop-loss-input").value
  ));
  const contractSize = Number(
    document.querySelector("#contract-size-select").value
  );

  return [index, rounding, risk, accountSize, sl, contractSize];
}

function validForm(arr) {
  return (
    arr.every((num) => num > 0)
    && arr.every((num) => !Number.isNaN(num))
  );
}

async function convertCurrency(from, to, amount) {
  const requestURL = `https://api.exchangerate.host/`
                      + `convert?from=${from}&to=${to}&amount=${amount}`;
  const response = await fetch(requestURL);

  if (response.ok) {
    return response;
  }

  throwError(response.status);
}

async function calculateLot() {
  const [index, rounding, risk, accountSize, sl, contractSize] = getFormData();
  const positionArr = [risk, accountSize, sl, contractSize];
  let lotSize;

  if (!validForm(positionArr)) {
    alert("The form is not valid. Please check your data.");
    throwError("The form is not valid");
  }

  if (index === "us30" || index === "nas100") {
    lotSize = ((risk * 0.01 * accountSize) / sl) / contractSize;
  } else if (index === "de30") {
    const riskPerPointInUSD = (risk * 0.01 * accountSize) / sl;
    const fetchResult = await convertCurrency("USD", "EUR", riskPerPointInUSD);
    const json = await fetchResult.json();
    const riskPerPointInEUR = json.result
                              || throwError("Rate conversion is null");
    lotSize = riskPerPointInEUR / contractSize;

    console.log(`DE30: Risk per point (USD): ${riskPerPointInUSD}`);
    console.log(`DE30: Risk per point (EUR): ${riskPerPointInEUR}`);
  }

  if (rounding.id === "round-input") {
    return Math.round((lotSize + Number.EPSILON) * 100) / 100;
  }

  return Math.floor(lotSize * 100) / 100;
}

async function displayLot() {
  const lotSizeInput = document.querySelector("#lot-size-input");
  lotSizeInput.value = "";
  lotSizeInput.setAttribute("placeholder", "Loading...");
  try {
    const lotSize = await calculateLot();
    lotSizeInput.value = lotSize;
  } catch (error) {
    lotSizeInput.setAttribute(
      "placeholder", "Invalid Data. Please try again."
    );
    console.log(error);
  }
}

const icons = Array.from(document.querySelectorAll(".icon"));
const calculateButton = document.querySelector("#calculateBtn");

icons.forEach(element => element.addEventListener('click', showTip));
calculateButton.addEventListener("click", displayLot);