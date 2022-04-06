// Form validation
const throwError = (message) => {
  throw new Error(message);
}

const convertCurrency = async (from, to, amount) => {
  const requestURL = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;
  let response = await fetch(requestURL);

  if (response.ok) {
    return response;
  }
  
  throwError(response.status);
}

const calculateLot = async () => {
  let index = document.querySelector('#index-select').value;
  let risk = Number(document.querySelector('#risk-input').value);
  let accountSize = Number(document.querySelector('#account-size-input').value);
  let sl = Number(document.querySelector('#stop-loss-input').value);
  let contractSize = Number(document.querySelector('#contract-size-select').value);

  if (index === 'us30' || index === 'nas100') {
    const lotSize = ((risk * 0.01 * accountSize) / sl) / contractSize;
    return Math.round((lotSize + Number.EPSILON) * 100) / 100;
  } else if (index === 'de30') {
    const riskPerPointInUSD = (risk * 0.01 * accountSize) / sl;    
    const fetchResult = await convertCurrency('USD', 'EUR', riskPerPointInUSD);    
    const json = await fetchResult.json();    
    const riskPerPointInEUR = json.result || throwError('Rate conversion is null');
    const lotSize = riskPerPointInEUR / contractSize;
    return Math.round((lotSize + Number.EPSILON) * 100) / 100;
  }
}

const displayLot = async () => {
  let lotSizeInput = document.querySelector('#lot-size-input');
  lotSizeInput.value = '';
  lotSizeInput.setAttribute('placeholder', 'Loading...')
  let lotSize = await calculateLot();  
  lotSizeInput.value = lotSize;
}

let calculateButton = document.querySelector('#calculateBtn');
calculateButton.addEventListener('click', displayLot);