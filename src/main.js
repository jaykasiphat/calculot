/**
 * @file main.js: Main file
 * @author Jay Kasiphat
 * @see <a href="https://github.com/jaykasiphat">Jay's Github<a>
 */

/**
 * @typedef {Object} MouseEvent
 */

/**
 * Return the current year
 * @returns {number} - current year
 */
function currentYear() {
  return new Date().getFullYear();
}

/**
 * Set element's display property to none
 * @param {HTMLElement} element - HTML element
 * @returns {void}
 */
function setVisibility(element) {
  if (Array.from(element.classList).includes('hidden')) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

/**
 * Set visibility for rounding/truncating info div
 * @param {MouseEvent} evt - Click event
 * @returns {void}
 */
function showTip(evt) {
  const roundingInfoDiv = document.querySelector('.round-info');
  const truncateInfoDiv = document.querySelector('.truncate-info');
  const iconClassName = evt.target.classList[0];

  if (iconClassName === 'round-icon') {
    setVisibility(roundingInfoDiv);
  } else {
    setVisibility(truncateInfoDiv);
  }
}

/**
 * Throw an error from the provided message
 * @param {string} message
 * @returns {void}
 */
function throwError(message) {
  throw new Error(message);
}

/**
 * Get HTML form data
 * @returns {Array}
 */
function getFormData() {
  const index = document.querySelector('#index-select').value;
  const roundingInputs = document.querySelectorAll("input[name='rounding']");
  let rounding = Array.from(roundingInputs);
  let risk = document.querySelector('#risk-input').value;
  let accountSize = document.querySelector('#account-size-input').value;
  let sl = document.querySelector('#stop-loss-input').value;
  let contractSize = document.querySelector('#contract-size-select').value;

  rounding = rounding.filter((input) => input.checked)[0];
  risk = Number(risk);
  accountSize = Number(accountSize);
  sl = Math.abs(Number(sl));
  contractSize = Number(contractSize);

  return [index, rounding, risk, accountSize, sl, contractSize];
}

/**
 * Return true if every number is greater than 0 and is not NaN, false otherwise
 * @param {Array<number>} arr - Array of position data
 * @returns {boolean}
 */
function validForm(arr) {
  return (
    arr.every((num) => num > 0)
    && arr.every((num) => !Number.isNaN(num))
  );
}

/**
 * Convert an amount of base currency to desired currency
 * @param {string} from - Base currency
 * @param {string} to - Conversion currency
 * @param {number} amount - Amount to be converted
 * @returns {Promise} - Promise object of conversion rate
 */
async function convertCurrency(from, to, amount) {
  const requestURL = 'https://api.exchangerate.host/'
                      + `convert?from=${from}&to=${to}&amount=${amount}`;
  const response = await fetch(requestURL);

  if (!response.ok) {
    throwError(response.status);
  }

  return response;
}

/**
 * Return the calculated lot size
 * @returns {Promise} - Promise object of calculated lot size
 */
async function calculateLot() {
  const [index, rounding, risk, accountSize, sl, contractSize] = getFormData();
  const positionArr = [risk, accountSize, sl, contractSize];
  let lotSize;

  if (!validForm(positionArr)) {
    alert('The form is not valid. Please check your data.');
    throwError('The form is not valid');
  }

  if (index === 'us30' || index === 'nas100') {
    lotSize = ((risk * 0.01 * accountSize) / sl) / contractSize;
  } else if (index === 'de30') {
    const riskPerPointInUSD = (risk * 0.01 * accountSize) / sl;
    const fetchResult = await convertCurrency('USD', 'EUR', riskPerPointInUSD);
    const json = await fetchResult.json();
    const riskPerPointInEUR = json.result
                              || throwError('Rate conversion is null');
    lotSize = riskPerPointInEUR / contractSize;

    console.log(`DE30: Risk per point (USD): ${riskPerPointInUSD}`);
    console.log(`DE30: Risk per point (EUR): ${riskPerPointInEUR}`);
  }

  if (rounding.id === 'round-input') {
    return Math.round((lotSize + Number.EPSILON) * 100) / 100;
  }

  return Math.floor(lotSize * 100) / 100;
}

/**
 * Display the lot size in an HTML input
 * @returns {void}
 */
async function displayLot() {
  const lotSizeInput = document.querySelector('#lot-size-input');
  lotSizeInput.value = '';
  lotSizeInput.setAttribute('placeholder', 'Loading...');
  try {
    const lotSize = await calculateLot();
    lotSizeInput.value = lotSize;
  } catch (error) {
    lotSizeInput.setAttribute('placeholder', 'Invalid Data. Please try again.');
    console.log(error);
  }
}

/**
 * Span elements containing icons
 * @type {Array}
 */
const icons = Array.from(document.querySelectorAll('.icon'));

/**
 * Button element
 * @type {HTMLElement}
 */
const calculateButton = document.querySelector('#calculateBtn');

/**
 * Span element
 * @type {HTMLElement}
 */
const footerSpan = document.querySelector('footer span');

icons.forEach((element) => element.addEventListener('click', showTip));
calculateButton.addEventListener('click', displayLot);
footerSpan.textContent = currentYear();