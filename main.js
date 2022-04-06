// TODO: Don't round lotSize up
// TODO: Clean & refactor
// TODO: Add comments

function throwError(message) {
  throw new Error(message);
}

function validForm(arr) {
  // Check if inputs are numbers without 0
  return (
    !arr.includes(0)
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
  const index = document.querySelector("#index-select").value;
  const risk = Number(
    document.querySelector("#risk-input").value
  );
  const accountSize = Number(
    document.querySelector("#account-size-input").value
  );
  const sl = Number(
    document.querySelector("#stop-loss-input").value
  );
  const contractSize = Number(
    document.querySelector("#contract-size-select").value
  );
  const positionArr = [index, risk, accountSize, sl, contractSize];

  if (!validForm(positionArr)) {
    alert("The form is not valid. Please check your data.");
    throwError("The form is not valid");
  }

  if (index === "us30" || index === "nas100") {
    const lotSize = ((risk * 0.01 * accountSize) / sl) / contractSize;
    return Math.round((lotSize + Number.EPSILON) * 100) / 100;
  } else if (index === "de30") {
    const riskPerPointInUSD = (risk * 0.01 * accountSize) / sl;
    const fetchResult = await convertCurrency("USD", "EUR", riskPerPointInUSD);
    const json = await fetchResult.json();
    const riskPerPointInEUR = json.result
                              || throwError("Rate conversion is null");
    const lotSize = riskPerPointInEUR / contractSize;

    console.log(`Risk per point (USD): ${riskPerPointInUSD}`);
    console.log(`Risk per point (EUR): ${riskPerPointInEUR}`);

    return Math.round((lotSize + Number.EPSILON) * 100) / 100;
  }
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

const calculateButton = document.querySelector("#calculateBtn");
calculateButton.addEventListener("click", displayLot);