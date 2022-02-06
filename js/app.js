// Serviceworker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceworker.js")
    .then((reg) => console.log("service worker registered"))
    .catch((err) => console.log("service worker not registered", err));
}

// State
const state = {
  loanDetails: {
    loanDate: "",
    loanAmount: "",
    rateOfInterest: "",
    tenure: "",
  },
  EMI: null,
  records: [],
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
const addRecordBtn = document.querySelector("#addRecordBtn");

// Events
window.addEventListener("load", () => {
  const records = JSON.parse(localStorage.getItem("EMI-Records"));
  state.records = !!records ? records : [];
});

loanDateInput.addEventListener("input", (e) => {
  state.loanDetails.loanDate = e.target.value;
});

loanAmountInput.addEventListener("input", (e) => {
  const loanAmount = e.target.value;

  if (loanAmount === "." && state.loanDetails.loanAmount === "") {
    state.loanDetails.loanAmount = "0.";
    return (loanAmountInput.value = state.loanDetails.loanAmount);
  }

  if (!loanAmount || loanAmount.match(/^\d{1,}(\.\d{0,2})?$/)) {
    return (state.loanDetails.loanAmount = parseFloat(e.target.value));
  }

  loanAmountInput.value = state.loanDetails.loanAmount;
});

rateOfInterestInput.addEventListener("input", (e) => {
  const rateOfInterest = e.target.value;

  if (rateOfInterest === "." && state.loanDetails.rateOfInterest === "") {
    state.loanDetails.rateOfInterest = "0.";
    return (rateOfInterestInput.value = state.loanDetails.rateOfInterest);
  }

  if (!rateOfInterest || rateOfInterest.match(/^\d{1,}(\.\d{0,2})?$/)) {
    return (state.loanDetails.rateOfInterest = parseFloat(e.target.value));
  }

  rateOfInterestInput.value = state.loanDetails.rateOfInterest;
});

tenureInput.addEventListener("input", (e) => {
  state.loanDetails.tenure = parseFloat(e.target.value);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const mediaMatch = window.matchMedia("(max-width: 736px)");

  if (mediaMatch.matches) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  state.EMI = findEMI(state.loanDetails);
  updateCount(state.EMI.EMI, showEMI);
  showDueDate.innerHTML = state.EMI.dueDate;
  showEndDate.innerHTML = state.EMI.endDate;
  updateCount(state.EMI.tenure, showTenure);
  updateCount(
    state.EMI.EMI * state.EMI.tenure - state.EMI.loanAmount,
    showTotalInterest
  );
  updateCount(state.EMI.EMI * state.EMI.tenure, showTotalAmount);
  addRecordBtn.disabled = false;
});

clearBtn.addEventListener("click", () => {
  form.reset();
  showEMI.innerHTML = 0;
  showDueDate.innerHTML = "-";
  showEndDate.innerHTML = "-";
  showTenure.innerHTML = 0;
  showTotalInterest.innerHTML = 0;
  showTotalAmount.innerHTML = 0;
  addRecordBtn.disabled = true;
});

addRecordBtn.addEventListener("click", () => {
  vex.dialog.open({
    message: "Enter applicant name:",
    input: [
      '<input name="applicantName" type="text" placeholder="Name" required />',
    ].join(""),
    buttons: [vex.dialog.buttons.YES, vex.dialog.buttons.NO],
    callback: function ({ applicantName }) {
      if (applicantName) {
        const record = {
          _id: generateUUID(),
          applicantName,
          loanDetails: state.loanDetails,
          EMI: state.EMI,
        };

        state.records.push(record);
        localStorage.setItem("EMI-Records", JSON.stringify(state.records));
      }
    },
  });
});

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

const generateUUID = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
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
