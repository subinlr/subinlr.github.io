// Serviceworker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceworker.js")
    .then((reg) => console.log("service worker registered"))
    .catch((err) => console.log("service worker not registered", err));
}

// State
const state = {
  loanDate: "",
  loanAmount: "",
  rateOfInterest: "",
  tenure: "",
};

// Elements
const form = document.querySelector("form");
const loanDateInput = document.querySelector("#loanDate");
const loanAmountInput = document.querySelector("#loanAmount");
const rateOfInterestInput = document.querySelector("#rateOfInterest");
const tenureInput = document.querySelector("#tenure");
const showEMI = document.querySelector("#showEMI");
const showDueDate = document.querySelector("#showDueDate");
const showEndDate = document.querySelector("#showEndDate");
const showTenure = document.querySelector("#showTenure");
const showTotalInterest = document.querySelector("#showTotalInterest");
const showTotalAmount = document.querySelector("#showTotalAmount");
const clearBtn = document.querySelector("#clearBtn");
const sideBar = document.querySelector("#sideBar");
const viewRecordsBtn = document.querySelector("#viewRecordsBtn");
const closeRecordsBtn = document.querySelector("#closeRecordsBtn");
const sideBarContent = document.querySelector("#sideBarContent");

// Events
window.addEventListener("load", () => {
  loanDateInput.valueAsDate = new Date();
});

loanDateInput.addEventListener("input", (e) => {
  state.loanDate = e.target.value;
});

loanAmountInput.addEventListener("input", (e) => {
  const loanAmount = e.target.value;

  if (loanAmount === "." && state.loanAmount === "") {
    state.loanAmount = "0.";
    return (loanAmountInput.value = state.loanAmount);
  }

  if (!loanAmount || loanAmount.match(/^\d{1,}(\.\d{0,2})?$/)) {
    return (state.loanAmount = parseFloat(e.target.value));
  }

  loanAmountInput.value = state.loanAmount;
});

rateOfInterestInput.addEventListener("input", (e) => {
  const rateOfInterest = e.target.value;

  if (rateOfInterest === "." && state.rateOfInterest === "") {
    state.rateOfInterest = "0.";
    return (rateOfInterestInput.value = state.rateOfInterest);
  }

  if (!rateOfInterest || rateOfInterest.match(/^\d{1,}(\.\d{0,2})?$/)) {
    return (state.rateOfInterest = parseFloat(e.target.value));
  }

  rateOfInterestInput.value = state.rateOfInterest;
});

tenureInput.addEventListener("input", (e) => {
  state.tenure = parseFloat(e.target.value);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const mediaMatch = window.matchMedia("(max-width: 736px)");

  if (mediaMatch.matches) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  const data = findEMI(state);
  updateCount(data.EMI, showEMI);
  showDueDate.innerHTML = data.dueDate;
  showEndDate.innerHTML = data.endDate;
  updateCount(data.tenure, showTenure);
  updateCount(data.EMI * data.tenure - data.loanAmount, showTotalInterest);
  updateCount(data.EMI * data.tenure, showTotalAmount);
});

clearBtn.addEventListener("click", () => form.reset());

viewRecordsBtn.addEventListener("click", () => {
  const mediaMatch = window.matchMedia("(max-width: 736px)");

  mediaMatch.matches
    ? (sideBar.style.width = "100%")
    : (sideBar.style.width = "20%");

  sideBarContent.style.opacity = "1";
});

closeRecordsBtn.addEventListener("click", () => {
  sideBarContent.style.opacity = "0";
  sideBar.style.width = "0";
});

// Functions
const updateCount = (data, element) => {
  element.innerText = "0";

  const update = () => {
    const target = +data;
    const count = +element.innerText;
    const speed = 200;

    const inc = target / speed;

    if (count < target) {
      element.innerText = Math.ceil(count + inc);
      setTimeout(update, 1);
    } else {
      element.innerText = target;
    }
  };

  update();
};

const findEMI = (loanDetails) => {
  const loanAmount = loanDetails.loanAmount;
  const rateOfInterest = loanDetails.rateOfInterest;
  const tenure = loanDetails.tenure;

  const loanDate = moment(loanDetails.loanDate, "YYYY-MM-DD").valueOf();
  const loanDay = moment(loanDate).get("date");

  let dueDate;

  if (loanDay >= 1 && loanDay <= 10) {
    dueDate = moment(loanDate).add(1, "months").set("date", 5);
  } else if (loanDay >= 11 && loanDay <= 20) {
    dueDate = moment(loanDate).add(1, "months").set("date", 10);
  } else if (
    loanDay >= 21 &&
    loanDay <= moment(loanDate).endOf("month").get("date")
  ) {
    dueDate = moment(loanDate).add(2, "months").set("date", 5);
  }

  const endDate = moment(dueDate).add(tenure - 1, "months");
  const totalDays =
    dueDate.diff(moment(loanDate), "days") + endDate.diff(dueDate, "days");
  const yearlyInterest = (loanAmount * rateOfInterest) / 100;
  const dayInterest = yearlyInterest / 365;
  const totalInterest = dayInterest * totalDays;
  const totalAmount = loanAmount + totalInterest;
  const EMI = totalAmount / tenure;

  return {
    EMI: Math.ceil(EMI),
    dueDate: dueDate.format("MMMM Do YYYY"),
    endDate: endDate.format("MMMM Do YYYY"),
    tenure,
    loanAmount,
  };
};
